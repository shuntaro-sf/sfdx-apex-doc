/* eslint-disable sf-plugin/dash-o */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/quotes */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, extname } from "path";
import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages, SfError } from "@salesforce/core";

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages("@shuntaro/sfdx-apex-doc", "apexdoc.generate");

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import * as ConfigData from "../../../src_config/apexdoc-generate.json";

export type ApexdocgenerateResult = {
  classInfos: ClassInfo[];
  inputdir: string;
  outputdir: string;
};

export type ParameterInfo = {
  Name: string;
  Description: string;
  Type: string;
};

export type ClassInfo = {
  Name: string;
  Description: string;
  Classes: ClassInfo[];
  Methods: MethodInfo[];
};

export type MethodInfo = {
  Name: string;
  Signature: string;
  Parameters: ParameterInfo[];
  Description: string;
  ReturnValue: string;
};

export default class Generate extends SfCommand<ApexdocgenerateResult> {
  public static readonly summary = messages.getMessage("summary");
  public static readonly description = messages.getMessage("description");
  public static readonly examples = messages.getMessages("examples");

  public static readonly flags = {
    inputdir: Flags.string({
      char: "i",
      summary: messages.getMessage("inputdir-flags.name.summary"),
      required: true,
    }),
    outputdir: Flags.string({
      char: "o",
      summary: messages.getMessage("outputdir-flags.name.summary"),
      required: true,
    }),
  };

  private static sectionLabel: { [key: string]: string } = ConfigData.sectionLabel;
  private static sectionDepth: { [key: string]: number } = ConfigData.sectionDepth;
  private static fileNameOfOutput: string = ConfigData.fileNameOfOutput;
  private static keyTag: string = ConfigData.keyTag;
  private static syntaxHighlighterLang: string = ConfigData.syntaxHighligherLang;

  private classInfos: ClassInfo[] = [] as ClassInfo[];

  public async run(): Promise<ApexdocgenerateResult> {
    const { flags } = await this.parse(Generate);
    if (!existsSync(flags.inputdir)) {
      throw new SfError(messages.getMessage("error.path.input") + flags.inputdir);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage("error.path.output") + flags.outputdir);
    }

    this.collectClassInfos(flags);

    this.updateReadme(flags);

    return {
      classInfos: this.classInfos,
      inputdir: flags.inputdir,
      outputdir: flags.outputdir,
    };
  }

  private collectClassInfos(flags: { inputdir: string; outputdir: string } & { [flag: string]: any } & { json: boolean | undefined }): void {
    const files = readdirSync(flags.inputdir);
    for (const file of files) {
      if (extname(file) !== ".cls") {
        continue;
      }

      const apexClass = readFileSync(join(flags.inputdir, file), {
        encoding: "utf8",
      });

      const classInfo = { Name: "", Description: "", Classes: [] as ClassInfo[], Methods: [] as MethodInfo[] };
      this.collectEachClassInfo(apexClass, classInfo);
      this.classInfos.push(classInfo);
    }
  }

  private collectParamInfo(strsToExtractParameters: RegExpMatchArray, doc: RegExpMatchArray | null, methodInfo: MethodInfo): void {
    const strToExtractParameters = strsToExtractParameters[0].replace(/[()]/g, "");
    strToExtractParameters.split(",").map((param) => {
      const parameterInfo = { Name: "", Description: "", Type: "" };
      param = param.trim();
      const regExpOfParamName = /[a-zA-Z]+$/;
      const paramMatch = param.match(regExpOfParamName);
      const typeMatch = param.split(regExpOfParamName);
      if (paramMatch === null || typeMatch === null) {
        return;
      }

      parameterInfo.Name = paramMatch[0].trim();
      parameterInfo.Type = typeMatch[0].trim();
      if (doc !== null) {
        const paramDescriptionMatch = doc[0].match(/@param\s*.*/);
        parameterInfo.Description = paramDescriptionMatch !== null ? paramDescriptionMatch[0].replace("@param", "").trim() : "";
      }
      methodInfo.Parameters.push(parameterInfo);
    });
  }

  private collectEachClassInfo(apexClass: string, classInfo: ClassInfo): void {
    const regExpOfClass = /\s*public\s+.*class\s*[A-Za-z]+\s*{/g;
    const apexClassSignatureMatch = apexClass.match(regExpOfClass);
    const apexClassSplitBySignature = apexClass.split(regExpOfClass);

    if (apexClassSignatureMatch === null) {
      return;
    }

    const strsToExtractClassName = apexClassSignatureMatch[0].replace(/.$/, "").trim().split(/\s/);
    classInfo.Name = strsToExtractClassName[strsToExtractClassName.length - 1];
    const regExpForDoc = /\/\*\*[\s\S]*\*\//;
    const doc = apexClassSplitBySignature[0].match(regExpForDoc);
    if (doc !== null) {
      const descriptionMatch = doc[0].match(/@description\s*.*/);
      classInfo.Description = descriptionMatch !== null ? descriptionMatch[0].replace("@description", "").trim() : "";
    }

    const apexClassWithoutSignature = apexClass.replace(apexClassSignatureMatch[0], "").replace(/}$/, "");
    apexClassSignatureMatch.shift();
    apexClassSplitBySignature.shift();
    const innerApexClasses = this.getInnerApexClasses(apexClassSignatureMatch, apexClassSplitBySignature);

    let apexClassWithoutInnerClasses = apexClassWithoutSignature;
    for (const innerClass of innerApexClasses) {
      apexClassWithoutInnerClasses = apexClassWithoutInnerClasses.replace(innerClass, "");
    }
    this.collectMethodInfos(apexClassWithoutInnerClasses, classInfo);

    for (const innerApexClass of innerApexClasses) {
      const eachInnerClassInfo = { Name: "", Description: "", Classes: [] as ClassInfo[], Methods: [] as MethodInfo[] };
      classInfo.Classes.push(eachInnerClassInfo);
      this.collectEachClassInfo(innerApexClass, eachInnerClassInfo);
    }
  }

  private collectMethodInfos(apexClass: string, classInfo: ClassInfo): void {
    const regExpOfEachMethods = /\s*public\s+.+\(.*\)\s*\{/g;
    const methods = apexClass.match(regExpOfEachMethods);
    const eachMethodSplit = apexClass.split(regExpOfEachMethods);

    if (methods === null) {
      return;
    }

    for (let idxOfMethod = 0; idxOfMethod < methods.length; idxOfMethod++) {
      const methodInfo = { Name: "", Description: "", Signature: "", Parameters: [] as ParameterInfo[], ReturnValue: "" };

      const regExpForParameters = /\(.*\)/;
      const strsToExtractMethodName = methods[idxOfMethod].replace(regExpForParameters, "").replace("{", "").trim().split(/\s/);
      methodInfo.Name = strsToExtractMethodName[strsToExtractMethodName.length - 1];

      const regExpForDoc = /\/\*\*[\s\S]*\*\//;
      const doc = eachMethodSplit[idxOfMethod].match(regExpForDoc);
      if (doc !== null) {
        const descriptionMatch = doc[0].match(/@description\s*.*/);

        methodInfo.Description = descriptionMatch !== null ? descriptionMatch[0].replace("@description", "").trim() : "";
      }
      methodInfo.Signature = methods[idxOfMethod].replace("{", "").trim();
      const strsToExtractParameters = methods[idxOfMethod].match(regExpForParameters);
      if (strsToExtractParameters !== null) {
        this.collectParamInfo(strsToExtractParameters, doc, methodInfo);
      }
      const strsToExtractReturnValue = methods[idxOfMethod].replace(regExpForParameters, "").replace("{", "").trim();
      const returnValue = strsToExtractReturnValue.replace("public", "").replace(methodInfo.Name, "").trim();
      methodInfo.ReturnValue = returnValue;

      classInfo.Methods.push(methodInfo);
    }
  }

  private getInnerApexClasses(apexClassSignatureMatch: RegExpMatchArray, apexClassSplitBySignature: string[]): string[] {
    const innerApexClasses = [];

    for (let idxOfInnerClassMatch = 0; idxOfInnerClassMatch < apexClassSignatureMatch.length; idxOfInnerClassMatch++) {
      let classBeforeStr = "";
      const strsBeforeClass = apexClassSplitBySignature[idxOfInnerClassMatch].split("");
      for (let idxOfStr = strsBeforeClass.length - 1; idxOfStr >= 0; idxOfStr--) {
        if (strsBeforeClass[idxOfStr] === "}") {
          classBeforeStr = strsBeforeClass.slice(idxOfStr + 1, strsBeforeClass.length).join("");
          break;
        }
      }
      const classSignature = apexClassSignatureMatch[idxOfInnerClassMatch];
      let classAfterStr = "";
      const strsAfterClass = apexClassSplitBySignature[idxOfInnerClassMatch + 1].split("");
      let depthOfScope = 1;
      for (let idxOfStr = 0; idxOfStr < strsAfterClass.length; idxOfStr++) {
        if (strsAfterClass[idxOfStr] === "{") {
          depthOfScope++;
        } else if (strsAfterClass[idxOfStr] === "}") {
          depthOfScope--;
        }
        if (depthOfScope === 0) {
          classAfterStr = strsAfterClass.slice(0, idxOfStr + 1).join("");
          break;
        }
      }
      const innerApexClass = classBeforeStr + classSignature + classAfterStr;
      innerApexClasses.push(innerApexClass);
    }
    return innerApexClasses;
  }

  private updateReadme(flags: { inputdir: string; outputdir: string } & { [flag: string]: any } & { json: boolean | undefined }): void {
    const linebreak = "\n";
    let classUsageStr = "";
    for (const classInfo of this.classInfos) {
      classUsageStr += this.getClassInfoUsageStr(classInfo, Generate.sectionDepth.class);
    }
    let readme = readFileSync(join(flags.outputdir, Generate.fileNameOfOutput), {
      encoding: "utf8",
    });
    const regExpForUsage = /<usage>[\s\S]*<\/usage>/;
    readme = readme.replace(regExpForUsage, "<" + Generate.keyTag + ">" + linebreak + classUsageStr + linebreak + "</" + Generate.keyTag + ">");
    writeFileSync(join(flags.outputdir, Generate.fileNameOfOutput), readme, "utf8");
  }

  private getClassInfoUsageStr(classInfo: ClassInfo, classSectionDepth: number): string {
    const sectionChar = "#";
    const whiteSpace = " ";
    const linebreak = "\n";

    const classHeader = sectionChar.repeat(classSectionDepth) + whiteSpace + classInfo.Name;
    const classDescription = classInfo.Description;

    const classUsageStrs = [classHeader, classDescription];
    for (const methodInfo of classInfo.Methods) {
      const medhodHeader = sectionChar.repeat(classSectionDepth + 1) + whiteSpace + methodInfo.Name;
      const methodDescription = methodInfo.Description;

      const signatureList = [Generate.sectionLabel.signature, methodInfo.Signature];
      const signatureSection = signatureList.join(linebreak.repeat(2) + linebreak.repeat(2));

      let paramSection = "";
      for (const param of methodInfo.Parameters) {
        const paramDetailList = [Generate.sectionLabel.paramDescription + param.Description, Generate.sectionLabel.paramType + param.Type];
        const paramDetailStr = whiteSpace.repeat(2) + paramDetailList.join(linebreak.repeat(2) + whiteSpace.repeat(4));
        const paramList = [Generate.sectionLabel.parameters, param.Name, paramDetailStr];
        paramSection += paramList.join(linebreak.repeat(2) + whiteSpace.repeat(2));
      }

      const returnList = [Generate.sectionLabel.returnValue, methodInfo.ReturnValue];
      const returnSection = returnList.join(linebreak.repeat(2) + whiteSpace.repeat(2));

      const codeBlockList = [signatureSection, paramSection, returnSection];
      const codeBlock =
        "```" + Generate.syntaxHighlighterLang + linebreak.repeat(1) + codeBlockList.join(linebreak.repeat(2)) + linebreak.repeat(1) + "```";

      const classUsageList = [medhodHeader, methodDescription, codeBlock];
      const classUsage = classUsageList.join(linebreak.repeat(2));
      classUsageStrs.push(classUsage);
    }
    let classUsageStr = classUsageStrs.join(linebreak.repeat(2));

    if (classInfo.Classes.length !== 0) {
      for (const innerClassInfo of classInfo.Classes) {
        classUsageStr += linebreak.repeat(2) + this.getClassInfoUsageStr(innerClassInfo, classSectionDepth + 1);
      }
    }
    return classUsageStr + linebreak.repeat(2);
  }
}