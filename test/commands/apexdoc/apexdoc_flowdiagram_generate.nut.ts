/* eslint-disable @typescript-eslint/quotes */
import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { execCmd, TestSession } from "@salesforce/cli-plugins-testkit";
import { expect } from "chai";
import { ApexdocflowgenerateResult } from "../../../src/commands/apexdoc/flowdiagram/generate";

let testSession: TestSession;

describe("apexdoc flowdiagram generate NUTs", () => {
  before("prepare session", async () => {
    testSession = await TestSession.create();
  });

  after(async () => {
    await testSession?.clean();
  });

  it("apexdoc flowdiagram generate", () => {
    const result = execCmd<ApexdocflowgenerateResult>("apexdoc flowdiagram generate -i test/resources/classes -o test/resources/flowdocs  --json", {
      ensureExitCode: 0,
    }).jsonOutput?.result;
    expect(result?.inputdir).to.equal("test/resources/classes");
    expect(result?.outputdir).to.equal("test/resources/flowdocs");
    expect(result?.classInfos[0].Name).to.equal("DynamicDao");
    expect(result?.classInfos[0].Methods[1].Name).to.equal("getSelfSObjectRecords");
    expect(result?.classInfos[0].Methods[1].Parameters[0].Name).to.equal("soqlQueryClause");
    expect(result?.classInfos[0].Methods[1].Parameters[0].Type).to.equal("SoqlQueryClause");
    expect(result?.classInfos[0].Methods[1].ReturnValue).to.equal("List<SObject>");

    fs.readdir("test/resources/docs", (err, files) => {
      if (err) throw err;
      for (const file of files) {
        shell.rm(path.join("test/resources/docs", file));
      }
    });
  });

  it("directory not found", () => {
    const resultInput = execCmd<ApexdocflowgenerateResult>("apexdoc flowdiagram generate -i test/notfound -o test/resources/flowdocs", { ensureExitCode: 1 }).jsonOutput?.result;
    const resultOutput = execCmd<ApexdocflowgenerateResult>("apexdoc flowdiagram generate -i test/resources/classes -o test/notfound", { ensureExitCode: 1 }).jsonOutput?.result;

    expect(resultInput).to.equal(undefined);
    expect(resultOutput).to.equal(undefined);
  });
});
