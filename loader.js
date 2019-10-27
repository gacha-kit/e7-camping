const axios = require("axios").default;
const fs = require("fs");

const writeJson = heroes => {
  fs.writeFileSync("./heroes.json", JSON.stringify(heroes));
};

const dupes = {};

(async function main() {
  const heroesResp = await axios.get("https://api.epicsevendb.com/api/hero");
  const possibleHeroes = heroesResp.data.results;
  const heroes = [];

  let index = 0;

  //limit of 300 req per minute. We do 1 request per second to stay well below.
  const interval = setInterval(async () => {
    const hero = possibleHeroes[index];

    const heroResp = await axios.get(
      `https://api.epicsevendb.com/api/hero/${hero._id}`
    );

    if (!dupes[hero._id]) {
      console.log(`Adding ${heroResp.data.results[0].name}`);
      const data = heroResp.data.results[0];
      heroes.push(data);
      dupes[data._id] = data;
    } else {
      console.log(`Skipping ${heroResp.data.results[0].name}, duplicate`);
    }

    index++;

    if (index >= possibleHeroes.length) {
      clearInterval(interval);
      writeJson(heroes);
    }
  }, 1000);
})();
