/**
 * Random bizarre trivia questions to break silence
 */

export const triviaQuestions = [
    "Did you know octopuses have three hearts?",
    "Why do flamingos stand on one leg?",
    "What's heavier, a ton of bricks or a ton of feathers?",
    "Can penguins fly underwater?",
    "Do fish ever get thirsty?",
    "What came first, the chicken or the egg?",
    "Why don't spiders stick to their own webs?",
    "How many holes does a straw have?",
    "Is cereal a soup?",
    "What would happen if you punched yourself and it hurt? Are you weak or strong?",
    "Why do we park in driveways and drive on parkways?",
    "If you clean a vacuum cleaner, are you the vacuum cleaner?",
    "Why is it called a building if it's already built?",
    "Do crabs think fish are flying?",
    "Why do round pizzas come in square boxes?",
    "What color is a mirror?",
    "If you time traveled and killed your grandfather, would you still exist?",
    "Can you cry underwater?",
    "Why isn't the number 11 pronounced onety-one?",
    "Do chickens think rubber eggs are their own?",
    "What happens if Pinocchio says 'my nose will grow now'?",
    "Why do we call them apartments when they're all stuck together?",
    "If poison expires, is it more poisonous or less poisonous?",
    "Why do they call it a hot water heater if the water is already hot?",
    "Do bald people use soap or shampoo on their head?",
    "If nothing is impossible, is it possible for something to be impossible?",
    "Why do kamikaze pilots wear helmets?",
    "If you drop soap on the floor, is the floor clean or is the soap dirty?",
    "Can a hearse carrying a corpse drive in the carpool lane?",
    "Why do we say 'heads up' when we actually duck?",
    // Halo questions
    "Do you think Master Chief actually finished the fight?",
    "Would you trust Cortana with your search history?",
    "Could the Covenant have won if the Elites just stayed loyal?",
    "What's dumber: running out of ammo on a Needler or missing with an Energy Sword?",
    "Do Grunts dream of throwing sticky grenades at Spartans?",
    "If you were stuck on a ring with the Flood, would you hit the self-destruct immediately?",
    "Is teabagging in Halo a valid form of psychological warfare?",
    "Could the Arbiter beat Master Chief in a fair 1v1?",
    "What if the Halo rings were actually just giant fidget spinners?",
    "Do you think Johnson actually knew what the ladies liked?",
    // Minecraft questions
    "Why do people punching trees make sense in Minecraft but not real life?",
    "If you could only eat one Minecraft food forever, would you choose raw chicken?",
    "Do creepers regret exploding or are they just kamikaze maniacs?",
    "Would you rather fight one Ender Dragon or 100 baby zombies?",
    // Battlefield questions
    "Remember when Battlefield 6 had those tornadoes? Did anyone actually enjoy them?",
    "What's worse: the Battlefield 6 launch or stepping on a Lego barefoot?",
    "Did anyone actually finish a full Battlefield 6 match without rage quitting?",
    // Random inside jokes
    "Remember Pizza Rita? What the hell was that about?",
    "Who thought Diet Coke bottle rockets were a good idea?",
    "What was the point of sliding a tray full of bread down the stairs?",
];

/**
 * Get a random trivia question
 */
export function getRandomTrivia() {
    return triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
}

export default triviaQuestions;
