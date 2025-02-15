import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: Record<string, recipe | ingredient> = {};

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  const cleanedName = recipeName
    .replace(/[-_]+/g, " ")
    .replace(/[^a-zA-Z ]/g, "")
    .trim();
  
  if (!cleanedName) return null;
  
  return cleanedName
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};


// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const { name, type, requiredItems, cookTime } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: "Missing 'name' or 'type'" });
  }

  if (type !== "recipe" && type !== "ingredient") {
    return res.status(400).json({ error: "Invalid type. Must be 'recipe' or 'ingredient'" });
  }

  if (cookbook[name]) {
    return res.status(400).json({ error: "Entry name must be unique" });
  }

  if (type === "recipe") {
    if (!Array.isArray(requiredItems)) {
      return res.status(400).json({ error: "Recipe must have a list of 'requiredItems'" });
    }
    
    const seenItems = new Set();
    for (const item of requiredItems) {
      if (!item.name || typeof item.quantity !== "number") {
        return res.status(400).json({ error: "Each requiredItem must have 'name' and 'quantity'" });
      }
      if (seenItems.has(item.name)) {
        return res.status(400).json({ error: "Duplicate requiredItem names are not allowed" });
      }
      seenItems.add(item.name);
    }
    
    cookbook[name] = { name, type, requiredItems };
  } else if (type === "ingredient") {
    if (typeof cookTime !== "number" || cookTime < 0) {
      return res.status(400).json({ error: "Ingredient must have a 'cookTime' >= 0" });
    }
    
    cookbook[name] = { name, type, cookTime };
  }

  return res.sendStatus(200);

});

const calculateRecipeSummary = (recipeName: string): { cookTime: number; ingredients: requiredItem[] } => {
  const recipe = cookbook[recipeName] as recipe;
  let totalCookTime = 0;
  const ingredientMap: Record<string, number> = {};

  for (const item of recipe.requiredItems) {
    const entry = cookbook[item.name];
    if (!entry) {
      throw new Error(`Missing ingredient: ${item.name}`);
    }

    if (entry.type === "ingredient") {
      const ingredient = entry as ingredient;
      totalCookTime += ingredient.cookTime * item.quantity;
      ingredientMap[item.name] = (ingredientMap[item.name] || 0) + item.quantity;
    } else {
      const { cookTime, ingredients } = calculateRecipeSummary(item.name);
      totalCookTime += cookTime * item.quantity;
      for (const ingr of ingredients) {
        ingredientMap[ingr.name] = (ingredientMap[ingr.name] || 0) + ingr.quantity * item.quantity;
      }
    }
  }

  const ingredientsList = Object.entries(ingredientMap).map(([name, quantity]) => ({ name, quantity }));
  return { cookTime: totalCookTime, ingredients: ingredientsList };
};

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const name = req.query.name as string;
  if (!name || !cookbook[name]) {
    return res.status(400).json({ error: "Recipe not found" });
  }

  const recipe = cookbook[name];
  if (recipe.type !== "recipe") {
    return res.status(400).json({ error: "Requested name is not a recipe" });
  }

  try {
    const { cookTime, ingredients } = calculateRecipeSummary(name);
    return res.json({ name, cookTime, ingredients });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
