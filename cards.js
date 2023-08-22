import Lithic from 'lithic'

//Imports from website
var buttonCreate = document.getElementById('create');
var buttonPay = document.getElementById('pay');
var input_name = document.getElementById('inputName');
var input_amount = document.getElementById('inputAmount');
var input_users = document.getElementById('inputUsers');

//Initialize Lithic package
const lithic = new Lithic({
    apiKey: '4226612e-c210-4581-bc7b-cff78941c64e',
    environment: 'sandbox'
})

//Math function to divide evenly the debt
function divideBillEvenly(amountToPay, numberOfUsers){
    //Divide evenly, but if there is an uneven number everyone will round up sorry but I MAKE THE RULES HERE
    let totalDue = amountToPay / numberOfUsers;
    if(amountToPay % numberOfUsers != 0){
        totalDue = Math.ceil(amountToPay / numberOfUsers);
    } 
    return totalDue;
}

//Update information of the current card
function updateCardInfo(name, limit, card_token, card_state){
    //Card params
    const data = {
        memo: name,
        spend_limit: limit,
        spend_limit_duration: "TRANSACTION",
        state: card_state
    };
    //Object card
    const card = lithic.cards.update(card_token, data);
    console.log(card_token)
}

//Funciton to create a new card (everytime piepay is launched within a new user)
function createCard(name, limit){

    const card = lithic.cards.create({
        type: 'SINGLE_USE',
        memo: name,
        spend_limit: limit,
        spend_limit_duration: "TRANSACTION",
        state: "OPEN"
    }).catch((err) => {
        if (err instanceof Lithic.APIError) {
            console.log(err.status); // 400
            console.log(err.name); // BadRequestError
            console.log(err.error?.message); // Invalid parameter(s): type
            console.log(err.error?.debugging_request_id); // 94d5e915-xxxx-4cee-a4f5-2xd6ebd279ac
            console.log(err.headers); // {server: 'nginx', ...}
          } else {
            throw err;
          }
    });
    return card
}

//Transaction
let amountToPay = 1;
let card;

//Whenever button is pressed start everything
buttonCreate.addEventListener('click', function() {
    //First we create the card that will hold the amount to be payed and the name of the transaction
    card = createCard(input_name, input_amount);

    //Then prompt how much each individual should pay
    amountToPay = divideBillEvenly(input_amount, input_users);
});

//Pay button 
buttonPay.addEventListener('click', async function(){
    try{
        //Generate transaction
        const simulation_params = TransactionSimulateAuthorizationParams = {
            amount: amountToPay,              	// Transaction amount in smallest denominator (pennies for USD)
            descriptor: input_name, 	// Transaction descriptor
            pan: card.pan,         	// Pass in the card.pan from the  "create card" step
            // ^^ PAN aka Primary Account Number aka Card Number.
            // This is the 16 digit number found on the front of cards.
          }
        await lithic.transactions.simulateAuthorization(simulation_params);

          //Authorize transaction
        const rule_params = AuthRuleCreateParams = {
            allowed_countries: ["USA"],
            card_tokens: [card.token] // apply rule to every transaction that occurs on this card
        };
        const rule = await lithic.authRules.create(rule)

        //View transaction status
        const transaction_params = TransactionListParams = {
            card_token: card.token // only retrieve transactions for this card
        };
        const transactions = await lithic.transactions.list(transaction_params);

    } catch (err) {
        console.error('An error occurred: ', err);
    }
});


/* Testing calls */

    // LIST ALL CARDS
    // let page = await lithic.cards.list();
    // for (const card of page.data) {
    //     console.log(card);
    // }

//updateCardInfo('Test', 100, 'af4c8df2-1fbb-41c4-8f35-431dba24d546');

