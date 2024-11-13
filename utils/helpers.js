// utils/helpers.js
export const generateRandomUsername = () => {
    const adjectives = ['Happy', 'Lucky', 'Sunny', 'Cool', 'Smart', 'Clever'];
    const nouns = ['Pokemon', 'Trainer', 'Master', 'Champion', 'Hero', 'Legend'];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  };
  
  export const getRandomProfileImage = () => {
    const pokemonIds = Array.from({ length: 151 }, (_, i) => i + 1);
    const randomId = pokemonIds[Math.floor(Math.random() * pokemonIds.length)];
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomId}.png`;
  };