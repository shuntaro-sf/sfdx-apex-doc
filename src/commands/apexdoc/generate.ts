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

type StrIndex = {
  str: string;
  index: number;
};

type PoppedStr = {
  popped: string[];
  result: string;
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
    docsdir: Flags.string({
      char: "d",
      summary: messages.getMessage("docsdir-flags.name.summary"),
      required: false,
      default: "docs",
    }),
    repourl: Flags.string({
      char: "u",
      summary: messages.getMessage("repourl-flags.name.summary"),
      required: false,
      default: "",
    }),
    releasever: Flags.string({
      char: "v",
      summary: messages.getMessage("releasever-flags.name.summary"),
      required: false,
      default: "",
    }),
  };

  private static sectionLabel: { [key: string]: string } = ConfigData.sectionLabel;
  private static sectionDepth: { [key: string]: number } = ConfigData.sectionDepth;
  private static outputExtension: string = ConfigData.outputExtension;
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

  private collectClassInfos(
    flags: { inputdir: string; outputdir: string; docsdir: string; repourl: string; releasever: string } & { [flag: string]: any } & {
      json: boolean | undefined;
    }
  ): void {
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
      if (classInfo.Name !== "") {
        this.classInfos.push(classInfo);
      }
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
    classInfo.Name = this.getName(apexClassSignatureMatch[0]);
    classInfo.Description = this.getDescription(apexClassSplitBySignature[0]);
    const innerApexClasses = this.popInnerApexClasses(apexClass, apexClassSignatureMatch, apexClassSplitBySignature);

    const apexClassWithoutInnerClasses = innerApexClasses.result.replace(apexClassSignatureMatch[0], "").replace(/}$/, "");

    this.collectMethodInfos(apexClassWithoutInnerClasses, classInfo);

    for (const innerApexClass of innerApexClasses.popped) {
      const eachInnerClassInfo = { Name: "", Description: "", Classes: [] as ClassInfo[], Methods: [] as MethodInfo[] };
      classInfo.Classes.push(eachInnerClassInfo);
      this.collectEachClassInfo(innerApexClass, eachInnerClassInfo);
    }
  }

  private getName(signatureMatchValue: string): string {
    const regExpForParameters = /\(.*\)/;
    const strsToExtractClassName = signatureMatchValue.replace(regExpForParameters, "").replace(/.$/, "").trim().split(/\s/);
    return strsToExtractClassName[strsToExtractClassName.length - 1];
  }

  private getDescription(docAboveSignature: string): string {
    const regExpOfDoc = /\/\*\*[\s\S]*\*\//;
    const doc = docAboveSignature.match(regExpOfDoc);
    if (doc === null) {
      return "";
    }
    const descriptionMatch = doc[0].match(/@description\s*.*/);
    return descriptionMatch !== null ? descriptionMatch[0].replace("@description", "").trim() : "";
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
      methodInfo.Name = this.getName(methods[idxOfMethod]);

      const regExpOfDoc = /\/\*\*[\s\S]*\*\//;
      const doc = eachMethodSplit[idxOfMethod].match(regExpOfDoc);
      methodInfo.Description = this.getDescription(eachMethodSplit[idxOfMethod]);
      methodInfo.Signature = methods[idxOfMethod].replace("{", "").trim();

      const regExpForParameters = /\(.*\)/;
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

  private popInnerApexClasses(apexClass: string, apexClassSignatureMatch: RegExpMatchArray, apexClassSplitBySignature: string[]): PoppedStr {
    const regExpOfClass = /\s*public\s+.*class\s*[A-Za-z]+\s*{/;
    const apexClassSignatureSearch = apexClass.search(regExpOfClass);
    apexClassSignatureMatch.shift();
    apexClassSplitBySignature.shift();
    let poppedApexClass = apexClass;
    const innerApexClasses = [];
    for (let idxOfInnerClassMatch = 0; idxOfInnerClassMatch < apexClassSignatureMatch.length; idxOfInnerClassMatch++) {
      const docOfMethod = this.getDocOfMethod(apexClass, apexClassSplitBySignature, idxOfInnerClassMatch);
      const classSignature = apexClassSignatureMatch[idxOfInnerClassMatch];
      const blockOfMethod = this.getBlockOfMethod(apexClass, apexClassSplitBySignature, idxOfInnerClassMatch);
      const innerApexClass = docOfMethod.str + classSignature + blockOfMethod.str;

      poppedApexClass =
        apexClass.substring(0, apexClassSignatureSearch - docOfMethod.index) + apexClass.substring(blockOfMethod.index - docOfMethod.index);
      innerApexClasses.push(innerApexClass);
    }
    return { popped: innerApexClasses, result: poppedApexClass };
  }

  private getBlockOfMethod(apexClass: string, apexClassSplitBySignature: string[], idxOfInnerClassMatch: number): StrIndex {
    const regExpOfClass = /\s*public\s+.*class\s*[A-Za-z]+\s*{/;
    const apexClassSignatureSearch = apexClass.search(regExpOfClass);
    let blockOfMethod = "";
    let classEndIndex = 0;
    const strsAfterClass = apexClassSplitBySignature[idxOfInnerClassMatch + 1].split("");
    let depthOfScope = 1;
    for (let idxOfStr = 0; idxOfStr < strsAfterClass.length; idxOfStr++) {
      if (strsAfterClass[idxOfStr] === "{") {
        depthOfScope++;
      } else if (strsAfterClass[idxOfStr] === "}") {
        depthOfScope--;
      }
      if (depthOfScope === 0) {
        blockOfMethod = strsAfterClass.slice(0, idxOfStr + 1).join("");
        classEndIndex = apexClassSignatureSearch + idxOfStr;
        break;
      }
    }
    return { str: blockOfMethod, index: classEndIndex };
  }

  private getDocOfMethod(apexClass: string, apexClassSplitBySignature: string[], idxOfInnerClassMatch: number): StrIndex {
    const regExpOfClass = /\s*public\s+.*class\s*[A-Za-z]+\s*{/;
    const apexClassSignatureSearch = apexClass.search(regExpOfClass);
    let docOfMethod = "";
    let classBeginIndex = 0;
    const strsBeforeClass = apexClassSplitBySignature[idxOfInnerClassMatch].split("");
    for (let idxOfStr = strsBeforeClass.length - 1; idxOfStr >= 0; idxOfStr--) {
      if (strsBeforeClass[idxOfStr] === "}") {
        docOfMethod = strsBeforeClass.slice(idxOfStr + 1, strsBeforeClass.length).join("");
        classBeginIndex = apexClassSignatureSearch - idxOfStr;
        break;
      }
    }
    return { str: docOfMethod, index: classBeginIndex };
  }

  private updateReadme(
    flags: { inputdir: string; outputdir: string; docsdir: string; repourl: string; releasever: string } & { [flag: string]: any } & {
      json: boolean | undefined;
    }
  ): void {
    const linebreak = "\n";
    let classUsageStr = "";
    let usageListStr = "";
    for (const classInfo of this.classInfos) {
      const readmeText = "[README]";
      const readmeUrlDirs = [flags.repourl, "blob", flags.releasever, "README" + Generate.outputExtension];
      const readmeUrl = "(" + readmeUrlDirs.join("/") + ")";
      const classHierarchy = readmeText + readmeUrl + "/" + classInfo.Name;
      classUsageStr += this.getClassInfoUsageStr(classInfo, Generate.sectionDepth.class, classHierarchy, flags);
      const urlDirs = [flags.repourl, "blob", flags.releasever, flags.docsdir, classInfo.Name + Generate.outputExtension];
      usageListStr += "- [" + classInfo.Name + "](" + urlDirs.join("/") + ")" + linebreak;
      writeFileSync(join(flags.outputdir, flags.docsdir, classInfo.Name + Generate.outputExtension), classUsageStr, "utf8");
    }
    let readme = readFileSync(join(flags.outputdir, "README" + Generate.outputExtension), {
      encoding: "utf8",
    });

    const regExpForUsage = new RegExp("<" + Generate.keyTag + ">[\\s\\S]*</" + Generate.keyTag + ">");
    readme = readme.replace(
      regExpForUsage,
      "<" + Generate.keyTag + ">" + linebreak.repeat(2) + usageListStr + linebreak + "</" + Generate.keyTag + ">"
    );

    writeFileSync(join(flags.outputdir, "README" + Generate.outputExtension), readme, "utf8");
  }

  private getClassInfoUsageStr(
    classInfo: ClassInfo,
    classSectionDepth: number,
    classHierarchy: string,
    flags: { inputdir: string; outputdir: string; docsdir: string; repourl: string; releasever: string } & { [flag: string]: any } & {
      json: boolean | undefined;
    }
  ): string {
    const sectionChar = "#";
    const whiteSpace = " ";
    const linebreak = "\n";

    const classHeader = sectionChar.repeat(classSectionDepth) + whiteSpace + classInfo.Name;
    const classDescription = classInfo.Description;

    const classUsageStrs = [classHierarchy, classHeader, classDescription];
    for (const methodInfo of classInfo.Methods) {
      this.pushMethodUsageStr(classUsageStrs, methodInfo, classSectionDepth);
    }
    let classUsageStr = classUsageStrs.join(linebreak.repeat(2));

    for (const innerClassInfo of classInfo.Classes) {
      const text = "[" + classHierarchy + "]";
      const urlDirs = [flags.repourl, "blob", flags.releasever, classInfo.Name + Generate.outputExtension];
      const url = "(" + urlDirs.join("/") + ")";
      const innerClassHierarchy = text + url + "/" + innerClassInfo.Name;
      classUsageStr += linebreak.repeat(2) + this.getClassInfoUsageStr(innerClassInfo, classSectionDepth + 1, innerClassHierarchy, flags);
    }
    return classUsageStr + linebreak.repeat(2);
  }

  private pushMethodUsageStr(classUsageStrs: string[], methodInfo: MethodInfo, classSectionDepth: number): void {
    const sectionChar = "#";
    const whiteSpace = " ";
    const linebreak = "\n";
    const medhodHeader = sectionChar.repeat(classSectionDepth + 1) + whiteSpace + methodInfo.Name;
    const methodDescription = methodInfo.Description;

    const signatureList = [Generate.sectionLabel.signature, methodInfo.Signature];
    const signatureSection = signatureList.join(linebreak.repeat(2) + whiteSpace.repeat(2));

    const paramSection = this.getParamUsageStr(methodInfo, whiteSpace, linebreak);

    const returnList = [Generate.sectionLabel.returnValue, methodInfo.ReturnValue];
    const returnSection = returnList.join(linebreak.repeat(2) + whiteSpace.repeat(2));

    const codeBlockList = [signatureSection, paramSection, returnSection];
    const codeBlock =
      "```" + Generate.syntaxHighlighterLang + linebreak.repeat(1) + codeBlockList.join(linebreak.repeat(2)) + linebreak.repeat(1) + "```";

    const classUsageList = [medhodHeader, methodDescription, codeBlock];
    const classUsage = classUsageList.join(linebreak.repeat(2));
    classUsageStrs.push(classUsage);
  }

  private getParamUsageStr(methodInfo: MethodInfo, whiteSpace: string, linebreak: string): string {
    let paramSection = "";
    for (const param of methodInfo.Parameters) {
      const paramDetailList = [Generate.sectionLabel.paramDescription + param.Description, Generate.sectionLabel.paramType + param.Type];
      const paramDetailStr = whiteSpace.repeat(2) + paramDetailList.join(linebreak.repeat(2) + whiteSpace.repeat(4));
      const paramList = [Generate.sectionLabel.parameters, param.Name, paramDetailStr];
      paramSection += paramList.join(linebreak.repeat(2) + whiteSpace.repeat(2));
    }
    return paramSection;
  }
}
