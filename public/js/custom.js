/**
 * Clientside helper functions
 */
//Initialize Stripe sdk with your account Publishable key
var stripe = Stripe('pk_test_6N6wZquvh3KxaPCwBjxNydJ700foQbuwZv');
var elements = stripe.elements();
var style = {
  base: {
    color: "#8E44AD",
  }
};


$(document).ready(function() {

  var amounts = document.getElementsByClassName("amount");
  var orderTotal = 0 ;
  // iterate through all "amount" elements and convert from cents to dollars
  for (var i = 0; i < amounts.length-1; i++) {
    amount = amounts[i].getAttribute('data-amount') / 100;  
    amounts[i].innerHTML = amount.toFixed(2);
    orderTotal += parseInt(amount.toFixed(2));
  }
  amounts[i].innerHTML = amount.toFixed(2);

  //prepare purchase 
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('item');

  var purchase = {
    items: [{ "id": itemId , "amt": orderTotal, "name":$("#purchase_item_title").text().trim()}]
  };
  
  //Attach stripe call element
  if(document.getElementById("card-element") != null)
  {
    var card = elements.create("card", { style: style });
    card.mount("#card-element");

    card.on('change', ({error}) => {
      let displayError = document.getElementById('card-errors');
      if (error) {
        displayError.textContent = error.message;
      } else {
        displayError.textContent = '';
      }
    });
  }
  
  //attach the submit event to paymentform to submit the transaction
  var paymentform = document.getElementById('payment-form');
  paymentform && paymentform.addEventListener('submit', function(ev) {
    ev.preventDefault();
    //fetch paymentIntent token from Stripe
    paymentSecret = (async () => {
        try{
          const response = await fetch('/create-payment-intent',{
            method: 'POST',
            body: JSON.stringify(purchase.items),
            headers: { 'Content-Type': 'application/json' }
          });
          const {clientSecret: clientSecret} = await response.json();
          return clientSecret;
        }catch(error){
          console.log(error.message)
        }
    })();

    //submit the card details with secret to Strip for transaction processing
    paymentSecret.then(function(client_secret){
      stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: card,
          billing_details: {
            name: 'test transaction'
          }
        }
      }).then(function(result) {
        if (result.error) {
          carderrElement = document.getElementById('card-errors'); 
          carderrElement.innerHTML = result.error.message;
        } else {
          // The payment has been processed!
          if (result.paymentIntent.status === 'succeeded') {
            productname = $("#purchase_item_title").text().trim();
            urlRedirect = `/success?id=${result.paymentIntent.id}&item=${productname}&amt=${orderTotal}`
            const htmlContent = fetch(urlRedirect,{
              method: 'GET'
            });
            htmlContent.then((response)=>{
              window.location.href=response.url;
            })
          }
        }
      });
    })
    .catch(error =>{
      throw e;
    });
  });
});