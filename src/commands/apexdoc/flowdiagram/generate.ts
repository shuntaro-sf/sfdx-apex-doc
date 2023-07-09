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
const messages = Messages.loadMessages("@shuntaro/sfdx-apex-doc", "flowdiagram.generate");

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import * as ConfigData from "../../../../src_config/apexdoc-flowdiagram-generate.json";

export type ApexdocflowgenerateResult = {
  classInfos: ClassInfo[];
  inputdir: string;
  outputdir: string;
};

export type ParameterInfo = {
  Name: string;
  Type: string;
};

export type ClassInfo = {
  Name: string;
  Classes: ClassInfo[];
  Methods: MethodInfo[];
};

export type MethodInfo = {
  Name: string;
  Parameters: ParameterInfo[];
  Block: string;
  ReturnValue: string;
};

export type Statement = {
  Id: string;
  Label: string;
  If: IfStatement;
  For: ForStatement;
  While: WhileStatement;
  Switch: SwitchStatement;
  ReferencesTo: string[];
};

export type IfStatement = {
  Id: string;
  Statements: Statement[];
  Condition: string;
  Else: IfStatement;
  ReferencesTo: string[];
  EndIndex: number;
};

export type ForStatement = {
  Id: string;
  If: IfStatement;
  Statements: Statement[];
  Expression: string;
  ReferencesTo: string[];
  EndIndex: number;
};

export type SwitchStatement = {
  Id: string;
  Expression: string;
  When: WhenStatement[];
  ReferencesTo: string[];
  EndIndex: number;
};

export type WhenStatement = {
  Id: string;
  Condition: string;
  Statements: Statement[];
  ReferencesTo: string[];
  EndIndex: number;
};

export type WhileStatement = {
  Id: string;
  If: IfStatement;
  Condition: string;
  ReferencesTo: string[];
  EndIndex: number;
};

type StrIndex = {
  str: string;
  index: number;
};

type PoppedStr = {
  popped: string[];
  result: string;
};

export default class Generate extends SfCommand<ApexdocflowgenerateResult> {
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

  private static outputExtension: string = ConfigData.outputExtension;
  private classInfos: ClassInfo[] = [] as ClassInfo[];
  private numberOfStatements = { ex: 0, if: 0, for: 0, while: 0, switch: 0, when: 0 };
  private flowStates = [] as string[];

  public async run(): Promise<ApexdocflowgenerateResult> {
    const { flags } = await this.parse(Generate);
    if (!existsSync(flags.inputdir)) {
      throw new SfError(messages.getMessage("error.path.input") + flags.inputdir);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage("error.path.output") + flags.outputdir);
    }

    this.collectClassInfos(flags);
    for (const classInfo of this.classInfos) {
      for (const method of classInfo.Methods) {
        const statements = this.collectStatements(method.Block);
        this.setReferencesTo(statements, "[*]");
        this.pushDiagramStr(statements, true);
        this.sortFlowStates();
        const flowDiagramStr = this.flowStates.join("\n");
        const mermaidStr = "```mermaid\nstateDiagram-v2\n" + flowDiagramStr + "\n```";
        this.writeFlowDiagramFile(mermaidStr, classInfo.Name + method.Name + Generate.outputExtension, flags);
      }
    }

    return {
      classInfos: this.classInfos,
      inputdir: flags.inputdir,
      outputdir: flags.outputdir,
    };
  }

  private writeFlowDiagramFile(
    diagramStr: string,
    fileName: string,
    flags: { inputdir: string; outputdir: string } & { [flag: string]: any } & { json: boolean | undefined }
  ): void {
    writeFileSync(join(flags.outputdir, fileName), diagramStr, "utf-8");
  }

  private collectStatements(methodBlock: string): Statement[] {
    const statements = [] as Statement[];
    let startIndex = 0;
    for (let idxOfBlockStr = 0; idxOfBlockStr < methodBlock.length; idxOfBlockStr++) {
      const statement = {
        Id: "",
        Label: "",
        If: {} as IfStatement,
        For: {} as ForStatement,
        While: {} as WhileStatement,
        Switch: {} as SwitchStatement,
        ReferencesTo: [] as string[],
      };
      let isInSingleQuote = false;
      if (methodBlock[idxOfBlockStr] === ";" && !isInSingleQuote) {
        statement.Id = "ex" + String(this.numberOfStatements.ex);
        statement.Label = methodBlock.slice(startIndex, idxOfBlockStr + 1);
        statements.push(statement);
        this.numberOfStatements.ex++;
        startIndex = idxOfBlockStr + 1;
      } else if (methodBlock[idxOfBlockStr] === "'" && methodBlock[idxOfBlockStr - 1] !== "/") {
        isInSingleQuote = !isInSingleQuote;
      }
      if (methodBlock[idxOfBlockStr] === "i" && !isInSingleQuote) {
        const regEpxOfOperator = /^if[\s\n]*\(/;
        const blockAfterIf = methodBlock.slice(idxOfBlockStr, methodBlock.length);
        if (blockAfterIf.match(regEpxOfOperator) !== null) {
          const ifStatement = this.getIfStatementBlock(methodBlock.slice(idxOfBlockStr, methodBlock.length), 0, 0);
          statement.If = ifStatement;
          statement.Id = ifStatement.Id;
          statements.push(statement);
          idxOfBlockStr += this.getIfEndIndex(statement.If);
          startIndex = idxOfBlockStr;
        }
      }
      if (methodBlock[idxOfBlockStr] === "f" && !isInSingleQuote) {
        const regEpxOfOperator = /^for[\s\n]*\(/;
        const blockAfterIf = methodBlock.slice(idxOfBlockStr, methodBlock.length);
        if (blockAfterIf.match(regEpxOfOperator) !== null) {
          const forStatement = this.getForStatementBlock(methodBlock.slice(idxOfBlockStr, methodBlock.length), 0);
          statement.For = forStatement;
          statement.Id = forStatement.Id;
          statements.push(statement);
          idxOfBlockStr += forStatement.EndIndex;
          startIndex = idxOfBlockStr;
        }
      }
      if (methodBlock[idxOfBlockStr] === "s" && !isInSingleQuote) {
        const regEpxOfOperator = /^switch[\s\n]*on[\s\n]*/;
        const blockAfterIf = methodBlock.slice(idxOfBlockStr, methodBlock.length);
        if (blockAfterIf.match(regEpxOfOperator) !== null) {
          const switchStatement = this.getSwitchStatementBlock(methodBlock.slice(idxOfBlockStr, methodBlock.length), 0);
          statement.Switch = switchStatement;
          statement.Id = switchStatement.Id;
          statements.push(statement);
          idxOfBlockStr += switchStatement.EndIndex;
          startIndex = idxOfBlockStr;
        }
      }
      if (methodBlock[idxOfBlockStr] === "w" && !isInSingleQuote) {
        const regEpxOfOperator = /^while[\s\n]*\(/;
        const blockAfterIf = methodBlock.slice(idxOfBlockStr, methodBlock.length);
        if (blockAfterIf.match(regEpxOfOperator) !== null) {
          const whileStatement = this.getWhileStatementBlock(methodBlock.slice(idxOfBlockStr, methodBlock.length), 0);
          statement.While = whileStatement;
          statement.Id = whileStatement.Id;
          statements.push(statement);
          idxOfBlockStr += whileStatement.EndIndex;
          startIndex = idxOfBlockStr;
        }
      }
    }

    return statements;
  }

  private getIfStatementBlock(blockStrs: string, idxOfBlockStr: number, numberOfIf: number): IfStatement {
    const ifStatement = { Id: "", Statements: [] as Statement[], Condition: "", Else: {} as IfStatement, ReferencesTo: [] as string[], EndIndex: idxOfBlockStr };
    ifStatement.Id = "if" + String(this.numberOfStatements.if);
    this.numberOfStatements.if++;
    let depthOfBlock = 0;
    let isInIfStatement = false;
    let isInSingleQuote = false;
    for (let idxOfBlockStrAfterIdx = 0; idxOfBlockStrAfterIdx < blockStrs.length; idxOfBlockStrAfterIdx++) {
      if (depthOfBlock === 0 && isInIfStatement) {
        ifStatement.Condition = this.getConditionOfIf(numberOfIf, blockStrs);
        ifStatement.Statements = this.getStatementsInIf(numberOfIf, blockStrs, idxOfBlockStrAfterIdx);
        const blockAfterIf = blockStrs.slice(idxOfBlockStrAfterIdx, blockStrs.length);
        const regExpOfElseIf = /^[\s\n]*else\s*if\s*\(/;
        const regExpOfElse = /^[\s\n]*else\s*/;
        if (blockAfterIf.match(regExpOfElseIf) !== null) {
          ifStatement.Else = this.getIfStatementBlock(blockAfterIf, idxOfBlockStr + idxOfBlockStrAfterIdx, numberOfIf + 1);
          break;
        } else if (blockAfterIf.match(regExpOfElse) !== null) {
          ifStatement.Else = this.getIfStatementBlock(blockAfterIf, idxOfBlockStr + idxOfBlockStrAfterIdx, numberOfIf + 1);
          break;
        } else {
          ifStatement.EndIndex = idxOfBlockStr + idxOfBlockStrAfterIdx;
          break;
        }
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "'" && blockStrs[idxOfBlockStrAfterIdx - 1] !== "/") {
        isInSingleQuote = !isInSingleQuote;
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "{" && !isInSingleQuote) {
        isInIfStatement = true;
        depthOfBlock++;
      } else if (blockStrs[idxOfBlockStrAfterIdx] === "}" && !isInSingleQuote) {
        depthOfBlock--;
      }
    }
    return ifStatement;
  }

  private getConditionOfIf(numberOfIf: number, blockStrs: string): string {
    let condition = "";
    const regExpOfElse = /^[\s\n]*else[\s\n]*{/;
    if (blockStrs.match(regExpOfElse) === null) {
      if (numberOfIf === 0) {
        condition = this.getParenthesis(blockStrs.replace(/^[\s\n]*if[\s\n]*\(/, ""));
      } else {
        condition = this.getParenthesis(blockStrs.replace(/^[\s\n]*else\s*if[\s\n]*\(/, ""));
      }
    }
    return condition;
  }

  private getStatementsInIf(numberOfIf: number, blockStrs: string, idxOfBlockStrAfterIdx: number): Statement[] {
    let statements = [];
    const regExpOfElse = /^[\s\n]*else[\s\n]*{/;
    if (blockStrs.match(regExpOfElse) === null) {
      if (numberOfIf === 0) {
        statements = this.collectStatements(blockStrs.slice(0, idxOfBlockStrAfterIdx - 1).replace(/^[\s\n]*if\s*\(.*\)[\s\n]*{/, ""));
      } else {
        statements = this.collectStatements(blockStrs.slice(0, idxOfBlockStrAfterIdx - 1).replace(/^[\s\n]*else\s*if\s*\(.*\)[\s\n]*{/, ""));
      }
    } else {
      statements = this.collectStatements(blockStrs.slice(0, idxOfBlockStrAfterIdx - 1).replace(/^[\s\n]*else[\s\n]*{/, ""));
    }
    return statements;
  }

  private getForStatementBlock(blockStrs: string, idxOfBlockStr: number): ForStatement {
    const forStatement = { Id: "", If: {} as IfStatement, Statements: [] as Statement[], Expression: "", ReferencesTo: [] as string[], EndIndex: idxOfBlockStr };
    forStatement.Id = "for" + String(this.numberOfStatements.for);
    this.numberOfStatements.for++;
    let depthOfBlock = 0;
    let isInForStatement = false;
    let isInSingleQuote = false;
    for (let idxOfBlockStrAfterIdx = 0; idxOfBlockStrAfterIdx < blockStrs.length; idxOfBlockStrAfterIdx++) {
      if (depthOfBlock === 0 && isInForStatement) {
        const regEpxOfOperator = /^[\s\n]*for\s*\(/;
        const ifStatement = { Id: "", Statements: [] as Statement[], Condition: "", Else: {} as IfStatement, ReferencesTo: [] as string[], EndIndex: 0 };
        const elseStatement = { Id: "", Statements: [] as Statement[], Condition: "", Else: {} as IfStatement, ReferencesTo: [] as string[], EndIndex: 0 };
        ifStatement.Id = "if" + String(this.numberOfStatements.if);
        this.numberOfStatements.if++;
        elseStatement.Id = "if" + String(this.numberOfStatements.if);
        this.numberOfStatements.if++;
        ifStatement.Statements = this.getStatementsInFor(blockStrs, idxOfBlockStrAfterIdx);
        ifStatement.Condition = this.getConditionOfFor(blockStrs.replace(regEpxOfOperator, ""));
        ifStatement.Else = elseStatement;
        const statementOfFor = this.getStatementOfFor(blockStrs);
        ifStatement.Statements.push(statementOfFor);
        forStatement.If = ifStatement;
        forStatement.Expression = this.getInitStatementOfFor(blockStrs);
        forStatement.EndIndex = idxOfBlockStr + idxOfBlockStrAfterIdx;
        break;
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "'" && blockStrs[idxOfBlockStrAfterIdx - 1] !== "/") {
        isInSingleQuote = !isInSingleQuote;
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "{" && !isInSingleQuote) {
        isInForStatement = true;
        depthOfBlock++;
      } else if (blockStrs[idxOfBlockStrAfterIdx] === "}" && !isInSingleQuote) {
        depthOfBlock--;
      }
    }
    return forStatement;
  }

  private getStatementsInFor(blockStrs: string, idxOfBlockStrAfterIdx: number): Statement[] {
    let statements = [];
    statements = this.collectStatements(blockStrs.slice(0, idxOfBlockStrAfterIdx - 1).replace(/^[\s\n]*for[\s\n]\(.*\)[\s\n]*{/, ""));
    return statements;
  }

  private getConditionOfFor(blockStrs: string): string {
    let condition = "";
    const forConditionInParenthesis = this.getParenthesis(blockStrs.replace(/^[\s\n]*for[\s\n]*\(/, ""));
    if (forConditionInParenthesis.includes(";")) {
      const statementsInparenthesis = forConditionInParenthesis.split(";");
      condition = statementsInparenthesis[1];
    } else {
      condition = "collection";
    }
    return condition;
  }

  private getStatementOfFor(blockStrs: string): Statement {
    const statement = {
      Id: "",
      Label: "",
      If: {} as IfStatement,
      For: {} as ForStatement,
      While: {} as WhileStatement,
      Switch: {} as SwitchStatement,
      ReferencesTo: [] as string[],
    };
    statement.Id = "ex" + String(this.numberOfStatements.ex);
    this.numberOfStatements.ex++;
    const forConditionInParenthesis = this.getParenthesis(blockStrs.replace(/^[\s\n]*for[\s\n]*\(/, ""));
    if (forConditionInParenthesis.includes(";")) {
      const statementsInparenthesis = forConditionInParenthesis.split(";");
      statement.Label = statementsInparenthesis[2];
    } else {
      const foreachConditionSplittedBySpace = forConditionInParenthesis.split(":")[0].trim().split(" ");
      const foreachElem = foreachConditionSplittedBySpace[foreachConditionSplittedBySpace.length - 1];
      statement.Label = "next " + foreachElem;
    }
    return statement;
  }

  private getInitStatementOfFor(blockStrs: string): string {
    let initStatement = "";
    const forConditionInParenthesis = this.getParenthesis(blockStrs.replace(/^[\s\n]*for[\s\n]*\(/, ""));
    if (forConditionInParenthesis.includes(";")) {
      const statementsInparenthesis = forConditionInParenthesis.split(";");
      initStatement = statementsInparenthesis[0];
    } else {
      initStatement = forConditionInParenthesis;
    }
    return initStatement;
  }

  private getWhileStatementBlock(blockStrs: string, idxOfBlockStr: number): WhileStatement {
    const whileStatement = { Id: "", If: {} as IfStatement, Condition: "", ReferencesTo: [] as string[], EndIndex: idxOfBlockStr };
    whileStatement.Id = "while" + String(this.numberOfStatements.while);
    this.numberOfStatements.while++;
    let depthOfBlock = 0;
    let isInWhileStatement = false;
    let isInSingleQuote = false;
    for (let idxOfBlockStrAfterIdx = 0; idxOfBlockStrAfterIdx < blockStrs.length; idxOfBlockStrAfterIdx++) {
      if (depthOfBlock === 0 && isInWhileStatement) {
        const regEpxOfOperator = /^[\s\n]*while\s*\(/;
        const ifStatement = { Id: "", Statements: [] as Statement[], Condition: "", Else: {} as IfStatement, ReferencesTo: [] as string[], EndIndex: 0 };
        const elseStatement = { Id: "", Statements: [] as Statement[], Condition: "", Else: {} as IfStatement, ReferencesTo: [] as string[], EndIndex: 0 };
        ifStatement.Id = "if" + String(this.numberOfStatements.if);
        this.numberOfStatements.if++;
        elseStatement.Id = "if" + String(this.numberOfStatements.if);
        this.numberOfStatements.if++;
        ifStatement.Statements = this.getStatementsInWhile(blockStrs, idxOfBlockStrAfterIdx);
        ifStatement.Condition = this.getParenthesis(blockStrs.replace(regEpxOfOperator, ""));
        ifStatement.Else = elseStatement;
        whileStatement.If = ifStatement;
        whileStatement.EndIndex = idxOfBlockStr + idxOfBlockStrAfterIdx;
        break;
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "'" && blockStrs[idxOfBlockStrAfterIdx - 1] !== "/") {
        isInSingleQuote = !isInSingleQuote;
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "{" && !isInSingleQuote) {
        isInWhileStatement = true;
        depthOfBlock++;
      } else if (blockStrs[idxOfBlockStrAfterIdx] === "}" && !isInSingleQuote) {
        depthOfBlock--;
      }
    }
    return whileStatement;
  }

  private getStatementsInWhile(blockStrs: string, idxOfBlockStrAfterIdx: number): Statement[] {
    let statements = [];
    statements = this.collectStatements(blockStrs.slice(0, idxOfBlockStrAfterIdx - 1).replace(/^[\s\n]*while[\s\n]\(.*\)[\s\n]*{/, ""));
    return statements;
  }

  private getSwitchStatementBlock(blockStrs: string, idxOfBlockStr: number): SwitchStatement {
    const switchStatement = { Id: "", Expression: "", When: [] as WhenStatement[], ReferencesTo: [] as string[], EndIndex: idxOfBlockStr };
    switchStatement.Id = "switch" + String(this.numberOfStatements.switch);
    this.numberOfStatements.switch++;
    let depthOfBlock = 0;
    let isInswitchStatement = false;
    let isInSingleQuote = false;
    for (let idxOfBlockStrAfterIdx = 0; idxOfBlockStrAfterIdx < blockStrs.length; idxOfBlockStrAfterIdx++) {
      if (depthOfBlock === 0 && isInswitchStatement) {
        switchStatement.Expression = this.getExpressionOfSwitch(blockStrs);
        switchStatement.EndIndex = idxOfBlockStr + idxOfBlockStrAfterIdx;
        break;
      }
      if (depthOfBlock === 1 && isInswitchStatement) {
        const blockAfterswitch = blockStrs.slice(idxOfBlockStrAfterIdx, blockStrs.length);
        const regExpOfWhen = /^[\s\n]*when\s*/;
        if (blockAfterswitch.match(regExpOfWhen) !== null) {
          const whenStatement = this.getWhenStatementBlock(blockAfterswitch);
          switchStatement.When.push(whenStatement);
          idxOfBlockStrAfterIdx += whenStatement.EndIndex;
        }
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "'" && blockStrs[idxOfBlockStrAfterIdx - 1] !== "/") {
        isInSingleQuote = !isInSingleQuote;
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "{" && !isInSingleQuote) {
        isInswitchStatement = true;
        depthOfBlock++;
      } else if (blockStrs[idxOfBlockStrAfterIdx] === "}" && !isInSingleQuote) {
        depthOfBlock--;
      }
    }
    return switchStatement;
  }

  private getExpressionOfSwitch(blockStrs: string): string {
    let expression = "";
    const strAfterSwitch = blockStrs.replace(/^[\s\n]*switch\s*on[\s\n]*/, "");
    for (let idxOfStr = 0; idxOfStr < strAfterSwitch.length; idxOfStr++) {
      if (strAfterSwitch[idxOfStr] === "{") {
        expression = strAfterSwitch.slice(0, idxOfStr);
        break;
      }
    }
    return expression;
  }

  private getWhenStatementBlock(blockStrs: string): WhenStatement {
    const whenStatement = { Id: "", Condition: "", Statements: [] as Statement[], ReferencesTo: [] as string[], EndIndex: 0 };
    whenStatement.Id = "when" + String(this.numberOfStatements.when);
    this.numberOfStatements.when++;

    let depthOfBlock = 0;
    let isInWhenStatement = false;
    let isInSingleQuote = false;
    for (let idxOfBlockStrAfterIdx = 0; idxOfBlockStrAfterIdx < blockStrs.length; idxOfBlockStrAfterIdx++) {
      if (depthOfBlock === 0 && isInWhenStatement) {
        whenStatement.Condition = this.getConditionOfWhen(blockStrs);
        whenStatement.Statements = this.getStatementsInWhen(blockStrs, idxOfBlockStrAfterIdx);
        whenStatement.EndIndex = idxOfBlockStrAfterIdx;
        break;
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "'" && blockStrs[idxOfBlockStrAfterIdx - 1] !== "/") {
        isInSingleQuote = !isInSingleQuote;
      }
      if (blockStrs[idxOfBlockStrAfterIdx] === "{" && !isInSingleQuote) {
        isInWhenStatement = true;
        depthOfBlock++;
      } else if (blockStrs[idxOfBlockStrAfterIdx] === "}" && !isInSingleQuote) {
        depthOfBlock--;
      }
    }
    return whenStatement;
  }

  private getStatementsInWhen(blockStrs: string, idxOfBlockStrAfterIdx: number): Statement[] {
    let statements = [];
    statements = this.collectStatements(blockStrs.slice(0, idxOfBlockStrAfterIdx - 1).replace(/^[\s\n]*when[\s\n]*.*[\s\n]*{/, ""));
    return statements;
  }

  private getConditionOfWhen(blockStrs: string): string {
    let condition = "";
    const strAfterWhen = blockStrs.replace(/^[\s\n]*when[\s\n]*/, "");
    for (let idxOfStr = 0; idxOfStr < strAfterWhen.length; idxOfStr++) {
      if (strAfterWhen[idxOfStr] === "{") {
        condition = strAfterWhen.slice(0, idxOfStr);
        break;
      }
    }
    return condition;
  }

  private getIfEndIndex(ifStatement: IfStatement): number {
    if (!Object.keys(ifStatement.Else).length) {
      return ifStatement.EndIndex;
    }
    return this.getIfEndIndex(ifStatement.Else);
  }

  private getParenthesis(blockStr: string): string {
    let isInSingleQuote = false;
    let depthOfParenthesis = 1;
    for (let idxOfBlockStr = 0; idxOfBlockStr < blockStr.length; idxOfBlockStr++) {
      if (blockStr[idxOfBlockStr] === "'" && blockStr[idxOfBlockStr - 1] !== "/") {
        isInSingleQuote = !isInSingleQuote;
      }
      if (blockStr[idxOfBlockStr] === "(" && !isInSingleQuote) {
        depthOfParenthesis++;
      } else if (blockStr[idxOfBlockStr] === ")" && !isInSingleQuote) {
        depthOfParenthesis--;
      }
      if (depthOfParenthesis === 0) {
        return blockStr.slice(0, idxOfBlockStr);
      }
    }
    return "";
  }

  private collectClassInfos(
    flags: { inputdir: string; outputdir: string } & { [flag: string]: any } & {
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

  private collectParamInfo(strsToExtractParameters: RegExpMatchArray, methodInfo: MethodInfo): void {
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

  private collectMethodInfos(apexClass: string, classInfo: ClassInfo): void {
    const regExpOfEachMethods = /\s*.*\s+[a-zA-Z]+\(.*\)\s*\{/g;
    const methods = apexClass.match(regExpOfEachMethods);
    const eachMethodSplit = apexClass.split(regExpOfEachMethods);
    if (methods === null) {
      return;
    }
    for (let idxOfMethod = 0; idxOfMethod < methods.length; idxOfMethod++) {
      const methodInfo = { Name: "", Block: "", Signature: "", Parameters: [] as ParameterInfo[], ReturnValue: "" };
      methodInfo.Name = this.getName(methods[idxOfMethod]);

      methodInfo.Signature = methods[idxOfMethod].replace("{", "").trim();
      methodInfo.Block = this.getBlockOfMethod(eachMethodSplit[idxOfMethod + 1]);
      const regExpForParameters = /\(.*\)/;
      const strsToExtractParameters = methods[idxOfMethod].match(regExpForParameters);
      if (strsToExtractParameters !== null) {
        this.collectParamInfo(strsToExtractParameters, methodInfo);
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
      const classSignature = apexClassSignatureMatch[idxOfInnerClassMatch];
      const blockOfMethod = this.getBlockOfClass(apexClass, apexClassSplitBySignature, idxOfInnerClassMatch);
      const innerApexClass = classSignature + blockOfMethod.str;

      poppedApexClass = apexClass.substring(0, apexClassSignatureSearch) + apexClass.substring(blockOfMethod.index);
      innerApexClasses.push(innerApexClass);
    }
    return { popped: innerApexClasses, result: poppedApexClass };
  }

  private getBlockOfClass(apexClass: string, apexClassSplitBySignature: string[], idxOfInnerClassMatch: number): StrIndex {
    const regExpOfClass = /\s*public\s+.*class\s*[A-Za-z]+\s*{/;
    const apexClassSignatureSearch = apexClass.search(regExpOfClass);
    let blockOfClass = "";
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
        blockOfClass = strsAfterClass.slice(0, idxOfStr + 1).join("");
        classEndIndex = apexClassSignatureSearch + idxOfStr;
        break;
      }
    }
    return { str: blockOfClass, index: classEndIndex };
  }

  private getBlockOfMethod(methodStrAfterSignature: string): string {
    let blockOfMethod = "";
    const strsAfterClass = methodStrAfterSignature.split("");
    let depthOfScope = 1;
    for (let idxOfStr = 0; idxOfStr < strsAfterClass.length; idxOfStr++) {
      if (strsAfterClass[idxOfStr] === "{") {
        depthOfScope++;
      } else if (strsAfterClass[idxOfStr] === "}") {
        depthOfScope--;
      }
      if (depthOfScope === 0) {
        blockOfMethod = strsAfterClass.slice(0, idxOfStr + 1).join("");
        break;
      }
    }
    return blockOfMethod;
  }

  private setReferencesTo(statements: Statement[], endStatement: string): void {
    for (let idxOfStatement = 0; idxOfStatement < statements.length - 1; idxOfStatement++) {
      if (Object.keys(statements[idxOfStatement].If).length) {
        this.setIfReferenecesTo(statements[idxOfStatement].If, statements[idxOfStatement + 1].Id);
      } else if (Object.keys(statements[idxOfStatement].For).length) {
        this.setForReferenecesTo(statements[idxOfStatement].For, statements[idxOfStatement + 1].Id);
      } else if (Object.keys(statements[idxOfStatement].While).length) {
        this.setWhileReferenecesTo(statements[idxOfStatement].While, statements[idxOfStatement + 1].Id);
      } else if (Object.keys(statements[idxOfStatement].Switch).length) {
        this.setSwitchReferenecesTo(statements[idxOfStatement].Switch, statements[idxOfStatement + 1].Id);
      } else {
        statements[idxOfStatement].ReferencesTo.push(statements[idxOfStatement + 1].Id);
      }
    }

    if (statements.length < 1) {
      return;
    }

    if (Object.keys(statements[statements.length - 1].If).length) {
      this.setIfReferenecesTo(statements[statements.length - 1].If, endStatement);
    } else if (Object.keys(statements[statements.length - 1].For).length) {
      this.setForReferenecesTo(statements[statements.length - 1].For, endStatement);
    } else if (Object.keys(statements[statements.length - 1].While).length) {
      this.setWhileReferenecesTo(statements[statements.length - 1].While, endStatement);
    } else if (Object.keys(statements[statements.length - 1].Switch).length) {
      this.setSwitchReferenecesTo(statements[statements.length - 1].Switch, endStatement);
    } else {
      statements[statements.length - 1].ReferencesTo.push(endStatement);
    }
  }

  private setIfReferenecesTo(ifStatement: IfStatement, endStatement: string): void {
    if (ifStatement.Statements.length > 0) {
      ifStatement.ReferencesTo.push(ifStatement.Statements[0].Id);
      this.setReferencesTo(ifStatement.Statements, endStatement);
    } else {
      ifStatement.ReferencesTo.push(endStatement);
    }
    if (!Object.keys(ifStatement.Else).length) {
      return;
    }
    if (!Object.keys(ifStatement.Else.Else).length) {
      if (ifStatement.Else.Statements.length > 0) {
        ifStatement.ReferencesTo.push(ifStatement.Else.Statements[0].Id);
      } else {
        ifStatement.ReferencesTo.push(endStatement);
      }
    } else {
      ifStatement.ReferencesTo.push(ifStatement.Else.Id);
    }
    this.setIfReferenecesTo(ifStatement.Else, endStatement);
  }

  private setForReferenecesTo(forStatement: ForStatement, endStatement: string): void {
    forStatement.ReferencesTo.push(forStatement.If.Id);
    this.setIfReferenecesTo(forStatement.If, endStatement);
    if (forStatement.If.Statements.length > 0) {
      forStatement.If.Statements[forStatement.If.Statements.length - 1].ReferencesTo = [forStatement.If.Id];
    } else {
      forStatement.If.ReferencesTo.push(forStatement.If.Id);
    }
  }

  private setWhileReferenecesTo(whileStatement: WhileStatement, endStatement: string): void {
    whileStatement.ReferencesTo.push(whileStatement.If.Id);
    this.setIfReferenecesTo(whileStatement.If, endStatement);
    if (whileStatement.If.Statements.length > 0) {
      whileStatement.If.Statements[whileStatement.If.Statements.length - 1].ReferencesTo = [whileStatement.If.Id];
    } else {
      whileStatement.If.ReferencesTo.push(whileStatement.If.Id);
    }
  }

  private setSwitchReferenecesTo(switchStatement: SwitchStatement, endStatement: string): void {
    for (const whenStatement of switchStatement.When) {
      switchStatement.ReferencesTo.push(whenStatement.Id);

      if (whenStatement.Statements.length > 0) {
        whenStatement.ReferencesTo.push(whenStatement.Statements[0].Id);
        this.setReferencesTo(whenStatement.Statements, endStatement);
      } else {
        whenStatement.ReferencesTo.push(endStatement);
      }
    }
  }

  private pushDiagramStr(statements: Statement[], isFirstRecursion: boolean): void {
    if (isFirstRecursion) {
      if (statements.length > 0) {
        this.flowStates.push("[*] --> " + statements[0].Id);
      } else {
        this.flowStates.push("[*] --> [*]");
      }
    }

    for (const statement of statements) {
      if (statement.Id.includes("ex")) {
        this.flowStates.push("state " + '"' + statement.Label + '"' + " as " + statement.Id);
      } else if (statement.Id.includes("switch")) {
        this.flowStates.push("state " + statement.Switch.Id + " <<choice>>");
      }

      for (const referenceTo of statement.ReferencesTo) {
        this.flowStates.push(statement.Id + " --> " + referenceTo);
      }
      if (Object.keys(statement.If).length) {
        this.pushIfDiagramStr(statement.If);
      }
      if (Object.keys(statement.For).length) {
        this.pushForDiagramStr(statement.For);
      }
      if (Object.keys(statement.While).length) {
        this.pushWhileDiagramStr(statement.While);
      }
      if (Object.keys(statement.Switch).length) {
        this.pushSwitchDiagramStr(statement.Switch);
      }
    }
  }

  private pushIfDiagramStr(ifStatement: IfStatement): void {
    if (Object.keys(ifStatement.Else).length) {
      this.flowStates.push("state " + ifStatement.Id + " <<choice>>");
      this.flowStates.push(ifStatement.Id + " --> " + ifStatement.ReferencesTo[0] + " : " + ifStatement.Condition);
      this.flowStates.push(ifStatement.Id + " --> " + ifStatement.ReferencesTo[1] + " : else");
      this.pushDiagramStr(ifStatement.Statements, false);
    }
    if (!Object.keys(ifStatement.Else).length) {
      this.pushDiagramStr(ifStatement.Statements, false);
      return;
    }
    this.pushIfDiagramStr(ifStatement.Else);
  }

  private pushForDiagramStr(forStatement: ForStatement): void {
    this.flowStates.push("state " + '"For loop\n' + forStatement.Expression + '"' + " as " + forStatement.Id);
    for (const referenceTo of forStatement.ReferencesTo) {
      this.flowStates.push(forStatement.Id + " --> " + referenceTo);
    }
    this.pushIfDiagramStr(forStatement.If);
  }

  private pushWhileDiagramStr(whileStatement: WhileStatement): void {
    this.flowStates.push('state "while loop" as ' + whileStatement.Id);
    for (const referenceTo of whileStatement.ReferencesTo) {
      this.flowStates.push(whileStatement.Id + " --> " + referenceTo);
    }
    this.pushIfDiagramStr(whileStatement.If);
  }

  private pushSwitchDiagramStr(switchStatement: SwitchStatement): void {
    for (let idxOfReference = 0; idxOfReference < switchStatement.ReferencesTo.length; idxOfReference++) {
      this.flowStates.push(switchStatement.Id + " --> " + switchStatement.ReferencesTo[idxOfReference] + " : " + switchStatement.When[idxOfReference].Condition);
      this.flowStates.push(switchStatement.When[idxOfReference].Id + " --> " + switchStatement.When[idxOfReference].ReferencesTo[0]);
      this.pushDiagramStr(switchStatement.When[idxOfReference].Statements, false);
    }
  }

  private sortFlowStates(): void {
    const states = this.flowStates.filter((e) => e.startsWith("state"));
    const flows = this.flowStates.filter((e) => !e.startsWith("state"));
    this.flowStates = states.concat(flows);
  }
}
