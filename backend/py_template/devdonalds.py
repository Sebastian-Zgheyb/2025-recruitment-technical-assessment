from dataclasses import dataclass
from typing import List, Dict, Union
from flask import Flask, request, jsonify
import re

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	required_items: List[RequiredItem]

@dataclass
class Ingredient(CookbookEntry):
	cook_time: int


# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Put this to avoid 404 error
@app.route("/")
def home():
    return "Hello, DevDonalds!"

# Store your recipes here!
cookbook = {}

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipe_name = data.get('input', '')
	parsed_name = parse_handwriting(recipe_name)
	if parsed_name is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsed_name}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that 
def parse_handwriting(recipeName: str) -> Union[str | None]:
	recipeName = re.sub(r"[-_]+", " ", recipeName)

	recipeName = re.sub(r"[^a-zA-Z ]", "", recipeName)

	words = recipeName.split()

	if not words:
		return None
	
	return " ".join(word.capitalize() for word in words)


# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
@app.route('/entry', methods=['POST'])
def create_entry():
	data = request.get_json()

	if "name" not in data or "type" not in data:
		return jsonify({"error": "Missing 'name' or 'type'"}), 400
	
	name = data["name"]
	entry_type = data["type"]

	if entry_type not in {"recipe", "ingredient"}:
		return jsonify({"error": "Invalid type. Must be 'recipe' or 'ingredient'"}), 400
	
	if name in cookbook:
		return jsonify({"error": "Entry name must be unique"}), 400
	
	if entry_type == "recipe":
		if "requiredItems" not in data or not isinstance(data["requiredItems"], list):
			return jsonify({"error": "Recipe must have a list of 'requiredItems"}), 400
		
		required_items = data["requiredItems"]
		seen_items = set()

		for item in required_items:
			if "name" not in item or "quantity" not in item:
				return jsonify({"error": "Each requiredItem must have 'name' and 'quantity'"}), 400
			
			if item["name"] in seen_items:
				return jsonify({"error": "Duplicate requiredItem names are not allowed"}), 400
			
			seen_items.add(item["name"])
		
		cookbook[name] = data
	
	elif entry_type == "ingredient":
		if "cookTime" not in data or not isinstance(data["cookTime"], int) or data["cookTime"] < 0:
			return jsonify({"error": "Ingredient must have a 'cookTime' >= 0"}), 400
		
		cookbook[name] = data

	return "", 200

# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name
@app.route('/summary', methods=['GET'])
def summary():
	# TODO: implement me
	return 'not implemented', 500


# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
