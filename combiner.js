const heroes = require("./heroes.json");
const combinatorics = require("js-combinatorics");
const fs = require("fs");
var stream = fs.createWriteStream("memoize.txt", { flags: "as" });

console.log(`${heroes.length} heroes`);
console.log(`Retrieving all hero combinations`);

let count = 0;
let highestScore = 0;
const cmb = combinatorics.bigCombination(heroes, 4);

/**
 * Get every combination of speaker to option
 * @param {*} members
 * @returns [ {member, option} ]
 */
const getSpeakerOptionCombos = members => {
  const combos = [];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const options = member.camping.options;

    for (let k = 0; k < options.length; k++) {
      const option = options[k];

      combos.push({ member, option });
    }
  }

  return combos;
};

/**
 * Gets all valid pairs that could happen in a camping scene
 * @param [{member, option},...] combos
 * @returns [
 * [{member, option},{member, option}],
 *  ...]
 */
const getValidPairs = combos => {
  //not enough speaking combos for two dialogs
  if (combos.length < 2) return [];
  const pairCmb = combinatorics.bigCombination(combos, 2);
  const validPairs = [];
  let invalidCount = 0;

  while ((pair = pairCmb.next())) {
    //validate the pair
    const first = pair[0];
    const second = pair[1];

    // same option cannot go twice
    if (first.option !== second.option) {
      validPairs.push(pair);
    } else {
      invalidCount++;
    }
  }

  return validPairs;
};

// gets the score for a single camping option
const getScoreForSingle = (single, members) => {
  //iterate through member list excluding the member who is speaking and capture a score
  const score = members.reduce((accumulator, member) => {
    //we iterate over all members, so we must skip the member that spoke
    if (single.member._id !== member._id) {
      return (accumulator += member.camping.reactions[single.option]);
    } else {
      return accumulator;
    }
  }, 0);

  return score;
};

const getScoreForPair = (validPair, members) => {
  let score = 0;

  for (let i = 0; i < validPair.length; i++) {
    const single = validPair[i];
    score += getScoreForSingle(single, members);
  }

  return score;
};

const getMaxScore = (validPairs, members) => {
  let maxScore = null;
  let maxPair = null;

  for (let i = 0; i < validPairs.length; i++) {
    const validPair = validPairs[i];

    // pair is a pair of speaker and options
    const score = getScoreForPair(validPair, members);

    if (!maxScore || score > maxScore) {
      maxScore = score;
      maxPair = validPair;
    }
  }

  return { maxScore, maxPair };
};

let team;

while ((members = cmb.next())) {
  count++;

  // get all option speaker combinations for this group of 4
  const combos = getSpeakerOptionCombos(members);

  // get all valid pairs of speaking combinations ([1A, 1B]; 1A, 2A; etc...)
  const validPairs = getValidPairs(combos);

  // get max score based on valid pairs relative to members of the group
  const { maxScore, maxPair } = getMaxScore(validPairs, members);

  // output to filesystem
  const toWrite = { members, maxScore, maxPair };
  stream.write(JSON.stringify(toWrite) + "\n");

  // if (count % 1000000 === 0) {
  //   console.log(`at ${count}`);
  // }

  if (maxScore && maxScore >= highestScore) {
    highestScore = maxScore;

    team = members.map(member => member.name);

    scoreInfo = maxPair.map(
      single => `${single.member.name}: ${single.option}`
    );

    console.log(
      `Max score became ${highestScore}. Team is ${team.toString()}. ${scoreInfo}.`
    );
  }
}

stream.end();
