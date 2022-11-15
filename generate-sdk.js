const { Solita } = require("@metaplex-foundation/solita");
const { writeFile } = require("fs/promises");
const path = require("path");

const idlDir = path.join(__dirname, "sdk/idl");
const configs = [
  {
    programName: "cardinal_rewards_center",
    programId: "rwcg7ZBhxV8ViZvueh5kRuQXkTGD8TmcoPmEpDutCUJ",
    programDir: "programs/cardinal-rewards-center",
    outDir: path.join(__dirname, "sdk", "generated/rewardsCenter"),
  },
];

async function main() {
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.error(`\n[${config.programName}] => ${config.outDir}`);
    const idlPath = path.join(idlDir, `${config.programName}.json`);
    const idl = require(idlPath);
    if (idl.metadata?.address == null) {
      idl.metadata = { ...idl.metadata, address: config.programId };
      await writeFile(idlPath, JSON.stringify(idl, null, 2));
    }
    const gen = new Solita(idl, { formatCode: true });
    await gen.renderAndWriteTo(config.outDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
