const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars')
//const stripe = require('stripe');
const stripe = require('stripe')('sk_test_tZemrYLxgDc62ml2VrguGO7I00C32NlAHz');


var app = express();
app.use(express.urlencoded({extended: true})); 
app.use(express.json());

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 */
app.get('/checkout', function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item = req.query.item;
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;     
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"      
      break;
  }

  res.render('checkout', {
    title: title,
    amount: amount,
    error: error
  });
});

/**
 * Success route
 */
app.get('/success', function(req, res) {
  res.status(200);
  res.setHeader('Content-Type', 'text/html');
  res.render('success',{
    id: req.query.id,
    productname : req.query.item,
    amount : parseInt(req.query.amt).toFixed(2)
  });
});


const calculateOrderAmount = (productItems) => {
  // calculate total order amounts in cents
  let orderTotal = 0;
  for(items of productItems)
  {
    orderTotal += items.amt;
  }
  return orderTotal * 100;
};

app.post("/create-payment-intent", async (req, res) => {
  //get orderTotal
  const orderTotal = calculateOrderAmount(req.body);
  if(orderTotal == undefined){
    res.send({
      error : "Item price is missing"
    });
  }

  // Create a PaymentIntent with the order amount and currency
  try
  {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: orderTotal,
      currency: "usd",
      payment_method_types: ['card']
    });
    res.send({
      clientSecret: paymentIntent.client_secret
    });
  }catch(e){
    console.log(e);
    res.send({
      error: e.message
    })
  }
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});