/* eslint-disable @typescript-eslint/quotes */
import { execCmd, TestSession } from "@salesforce/cli-plugins-testkit";
import { expect } from "chai";
import { ApexdocgenerateResult } from "../../../src/commands/apexdoc/doc/generate";

let testSession: TestSession;

describe("apexdoc generate NUTs", () => {
  before("prepare session", async () => {
    testSession = await TestSession.create();
  });

  after(async () => {
    await testSession?.clean();
  });

  it("apexdoc generate", () => {
    const result = execCmd<ApexdocgenerateResult>("apexdoc doc generate -i test/resources/classes -o test/resources  --json", {
      ensureExitCode: 0,
    }).jsonOutput?.result;
    expect(result?.inputdir).to.equal("test/resources/classes");
    expect(result?.outputdir).to.equal("test/resources");

    expect(result?.classInfos[0].Name).to.equal("DynamicDao");
    expect(result?.classInfos[0].Description).to.equal("Class");
    expect(result?.classInfos[0].Methods[1].Name).to.equal("getSelfSObjectRecords");
    expect(result?.classInfos[0].Methods[1].Description).to.equal("Gets the records of sObjectType.");
    expect(result?.classInfos[0].Methods[1].Signature).to.equal("public List<SObject> getSelfSObjectRecords(SoqlQueryClause soqlQueryClause)");
    expect(result?.classInfos[0].Methods[1].Parameters[0].Name).to.equal("soqlQueryClause");
    expect(result?.classInfos[0].Methods[1].Parameters[0].Type).to.equal("SoqlQueryClause");
    expect(result?.classInfos[0].Methods[1].Parameters[0].Description).to.equal(
      "soqlQueryClause SoqlQueryClause object to be converted to a soql query string when extracting records."
    );
    expect(result?.classInfos[0].Methods[1].ReturnValue).to.equal("List<SObject>");
  });

  it("directory not found", () => {
    const resultInput = execCmd<ApexdocgenerateResult>("apexdoc doc generate -i test/notfound -o test/resources", { ensureExitCode: 1 }).jsonOutput?.result;
    const resultOutput = execCmd<ApexdocgenerateResult>("apexdoc doc generate -i test/resources/classes -o test/notfound", { ensureExitCode: 1 }).jsonOutput?.result;

    expect(resultInput).to.equal(undefined);
    expect(resultOutput).to.equal(undefined);
  });
});
