var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const search_utils = require("./utils/search_utils");
const DButils = require("./utils/DButils");


/**
 * This path returns 3 random preview recipes
 */
router.get("/random", async (req, res, next) => {
  try {
    let random_3_recipes = await recipes_utils.getRandomThreeRecipes();
    res.send(random_3_recipes);
  } catch (error) {
    next(error);
  }
}); 


router.get("/search/", async (req, res, next) => {
  try{
  const {searchQuery, num, cuisine, diet, intolerances} = req.query;
  // set search params
  search_params = {};
  search_params.query = searchQuery;
  search_params.cuisine = cuisine;
  search_params.diet = diet;
  search_params.intolerances = intolerances;
  search_params.number = num;
  search_params.instructionsRequired = true;
  search_params.apiKey = process.env.spooncular_apiKey; 
  console.log(search_params);
  //gives a defult num
  if (num != 5 && num != 10 && num != 15) {
    search_params.number = 5;
  }
  let search_pool = await  search_utils.searchForRecipes(search_params);
  let search_data = search_pool.data.results;
  let recipe_ids = []
  for (let j = 0;j < search_data.length; j++) {
    recipe_ids.push(search_data[j].id);
  }
  let results = await recipes_utils.getRecipesPreview(recipe_ids);
  res.send(results);
} catch (error){
  next(error);
}
})
;

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/info/:recipeId", async (req, res, next) => {
  console.log("in get recipe");
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

/**
 * Authenticate POST requests by middleware
 */
 router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


router.post("/createRecipe", async (req, res, next) => {
  console.log("in create recipe")
  try {
    // parameters exists
    // valid parameters
    let recipe_details = {
      title: req.body.title,
      readyInMinutes: req.body.readyInMinutes,
      image: req.body.image,
      vegan: req.body.vegan,
      vegetarian: req.body.vegetarian,
      glutenFree: req.body.glutenFree,
      extendedIngredients: req.body.extendedIngredients,
      analyzedInstructions: req.body.analyzedInstructions,
      servings: req.body.servings
    }
    const user_id = req.session.user_id;
    await DButils.execQuery(
      `INSERT INTO recipes (title, readyInMinutes, image, vegan, vegetarian, glutenFree, extendedIngredients, analyzedInstructions, servings, user_id) VALUES ('${recipe_details.title}', '${recipe_details.readyInMinutes}', '${recipe_details.image}', '${recipe_details.vegan}', '${recipe_details.vegetarian}', '${recipe_details.glutenFree}', '${recipe_details.extendedIngredients}', '${recipe_details.analyzedInstructions}', '${recipe_details.servings}','${user_id}')`
    );
    res.status(201).send({ message: "recipe added", success: true });
  } catch (error) {
    next(error);
  }
});


router.get("/myRecipe/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getMyRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
