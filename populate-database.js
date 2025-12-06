const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-west-2' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CATEGORIES_TABLE = 'retail-supermarket-categories';
const PRODUCTS_TABLE = 'retail-supermarket-products';
const INVENTORY_TABLE = 'retail-supermarket-inventory';

// Sample Categories
const categories = [
  {
    categoryId: 'cat-fruits',
    name: 'Fruits & Vegetables',
    description: 'Fresh fruits and vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&h=500&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    categoryId: 'cat-dairy',
    name: 'Dairy & Eggs',
    description: 'Milk, cheese, yogurt, and eggs',
    imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&h=500&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    categoryId: 'cat-bakery',
    name: 'Bakery',
    description: 'Fresh bread, cakes, and pastries',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=500&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    categoryId: 'cat-beverages',
    name: 'Beverages',
    description: 'Soft drinks, juices, and water',
    imageUrl: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?w=500&h=500&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    categoryId: 'cat-snacks',
    name: 'Snacks',
    description: 'Chips, cookies, and snacks',
    imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&h=500&fit=crop',
    createdAt: new Date().toISOString()
  }
];

// Sample Products
const products = [
  // Fruits & Vegetables
  {
    productId: 'prod-apple',
    name: 'Fresh Apples',
    description: 'Crisp and sweet red apples',
    price: 3.99,
    categoryId: 'cat-fruits',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&h=500&fit=crop',
    unit: 'lb',
    brand: 'Fresh Farms',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'prod-banana',
    name: 'Bananas',
    description: 'Fresh yellow bananas',
    price: 1.99,
    categoryId: 'cat-fruits',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&h=500&fit=crop',
    unit: 'lb',
    brand: 'Fresh Farms',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'prod-tomato',
    name: 'Tomatoes',
    description: 'Ripe red tomatoes',
    price: 2.49,
    categoryId: 'cat-fruits',
    imageUrl: 'https://images.unsplash.com/photo-1546470427-227e9c9b2c98?w=500&h=500&fit=crop',
    unit: 'lb',
    brand: 'Fresh Farms',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Dairy & Eggs
  {
    productId: 'prod-milk',
    name: 'Whole Milk',
    description: 'Fresh whole milk',
    price: 4.99,
    categoryId: 'cat-dairy',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&h=500&fit=crop',
    unit: 'gallon',
    brand: 'Dairy Fresh',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'prod-eggs',
    name: 'Large Eggs',
    description: 'Farm fresh large eggs',
    price: 3.49,
    categoryId: 'cat-dairy',
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&h=500&fit=crop',
    unit: 'dozen',
    brand: 'Farm Fresh',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'prod-cheese',
    name: 'Cheddar Cheese',
    description: 'Sharp cheddar cheese block',
    price: 5.99,
    categoryId: 'cat-dairy',
    imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&h=500&fit=crop',
    unit: 'lb',
    brand: 'Cheese Co',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Bakery
  {
    productId: 'prod-bread',
    name: 'Whole Wheat Bread',
    description: 'Fresh baked whole wheat bread',
    price: 2.99,
    categoryId: 'cat-bakery',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=500&fit=crop',
    unit: 'loaf',
    brand: 'Bakery Fresh',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'prod-croissant',
    name: 'Butter Croissants',
    description: 'Flaky butter croissants',
    price: 4.49,
    categoryId: 'cat-bakery',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&h=500&fit=crop',
    unit: 'pack of 6',
    brand: 'Bakery Fresh',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Beverages
  {
    productId: 'prod-orange-juice',
    name: 'Orange Juice',
    description: '100% pure orange juice',
    price: 5.49,
    categoryId: 'cat-beverages',
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop',
    unit: '64 oz',
    brand: 'Tropicana',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'prod-water',
    name: 'Spring Water',
    description: 'Natural spring water',
    price: 3.99,
    categoryId: 'cat-beverages',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500&h=500&fit=crop',
    unit: '24 pack',
    brand: 'Aquafina',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Snacks
  {
    productId: 'prod-chips',
    name: 'Potato Chips',
    description: 'Classic salted potato chips',
    price: 2.99,
    categoryId: 'cat-snacks',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&h=500&fit=crop',
    unit: 'bag',
    brand: 'Lays',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'prod-cookies',
    name: 'Chocolate Chip Cookies',
    description: 'Delicious chocolate chip cookies',
    price: 3.49,
    categoryId: 'cat-snacks',
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&h=500&fit=crop',
    unit: 'pack',
    brand: 'Chips Ahoy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample Inventory (for each product at main location)
const inventory = products.map(product => ({
  productId: product.productId,
  locationId: 'loc-main',
  locationName: 'Main Store',
  quantity: Math.floor(Math.random() * 100) + 50, // Random quantity between 50-150
  reorderLevel: 20,
  lastRestocked: new Date().toISOString()
}));

async function addCategories() {
  console.log('Adding categories...');
  for (const category of categories) {
    try {
      await dynamodb.put({
        TableName: CATEGORIES_TABLE,
        Item: category
      }).promise();
      console.log(`✓ Added category: ${category.name}`);
    } catch (error) {
      console.error(`✗ Failed to add category ${category.name}:`, error.message);
    }
  }
}

async function addProducts() {
  console.log('\nAdding products...');
  for (const product of products) {
    try {
      await dynamodb.put({
        TableName: PRODUCTS_TABLE,
        Item: product
      }).promise();
      console.log(`✓ Added product: ${product.name}`);
    } catch (error) {
      console.error(`✗ Failed to add product ${product.name}:`, error.message);
    }
  }
}

async function addInventory() {
  console.log('\nAdding inventory...');
  for (const item of inventory) {
    try {
      await dynamodb.put({
        TableName: INVENTORY_TABLE,
        Item: item
      }).promise();
      console.log(`✓ Added inventory for product: ${item.productId} (Qty: ${item.quantity})`);
    } catch (error) {
      console.error(`✗ Failed to add inventory for ${item.productId}:`, error.message);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('Populating Retail Supermarket Database');
  console.log('========================================\n');

  try {
    await addCategories();
    await addProducts();
    await addInventory();
    
    console.log('\n========================================');
    console.log('✓ Database populated successfully!');
    console.log('========================================');
    console.log(`\nAdded:`);
    console.log(`  - ${categories.length} categories`);
    console.log(`  - ${products.length} products`);
    console.log(`  - ${inventory.length} inventory items`);
  } catch (error) {
    console.error('\n✗ Error populating database:', error);
    process.exit(1);
  }
}

main();
