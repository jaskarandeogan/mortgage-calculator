# Mortgage Calculator API
An Express.js API for calculating mortgage payments, including BC CMHC insurance premiums and various payment schedules for Canadian mortgages.

## Features

Mortgage payment calculations with different payment schedules:
- Monthly payments
- Bi-weekly payments
- Accelerated bi-weekly payments
CMHC insurance premium calculations

Support for different employment types:
- Regular employment
- Self-employed
- Non-traditional employment
- First-time home buyer considerations
- Down payment source validation
- New construction property handling

## API Endpoints

### Get CMHC Information
```GET /api/mortgage/cmhc-info ```

Returns current CMHC premium rates and rules, including:
- Premium rates for different down payment ranges
- Maximum property value limits
- Minimum down payment rules
- Maximum amortization periods
Example Response:
```
{
    "premiumRates": {
        "regular": {
            "5-9.99": 4,
            "10-14.99": 3.1,
            "15-19.99": 2.8,
            "20+": 0
        },
        "nonTraditional": {
            "5-9.99": 4.5,
            "10-14.99": 3.1,
            "15-19.99": 2.8,
            "20+": 0
        },
        "selfEmployed": {
            "10-14.99": 4.75,
            "15-19.99": 2.9,
            "20+": 0
        }
    },
    "rules": {
        "maxPropertyValue": 1500000,
        "minDownPaymentRules": {
            "upTo500k": "5% of purchase price",
            "over500kTo1M": "5% of first $500,000 + 10% of remaining",
            "over1M": "20% of purchase price"
        },
        "maxAmortization": {
            "regular": 25,
            "firstTimeBuyerOrNewConstruction": 30
        },
        "extendedAmortization": {
            "eligibility": [
                "first-time-buyer",
                "new-construction"
            ],
            "additionalPremium": 0.2
        }
    }
}
```

## Calculate Mortgage
`POST /api/mortgage/calculate`

### Request Body:

```
{
    "propertyPrice": 500000,
    "downPayment": 50000,
    "annualInterestRate": 5.99,
    "amortizationPeriod": 25,
    "paymentSchedule": "monthly",
    "isFirstTimeBuyer": true,
    "isNewConstruction": false,
    "downPaymentSource": "traditional",
    "employmentType": "regular"
}
```

### Response:

```
{
    "status": "success",
    "data": {
        "paymentAmount": 2986.4,
        "cmhcInsurance": 13950,
        "totalMortgage": 463950,
        "mortgageBeforeCMHC": 450000,
        "downPaymentPercentage": 10,
        "cmhcPremiumRate": 0.031
    },
    "message": "Mortgage calculated successfully"
}
```


## Installation

```
# Clone the repository
git clone https://github.com/jaskarandeogan/mortgage-calculator

# Install dependencies
npm install

# create .env file as in example

# Start the server
npm start

# Run in development mode
npm run dev
```

## ENVs Example
```
PORT=8080
NODE_ENV=development
```

## Testing
```
# Run tests
npm test
```

### Tests cover:

- CMHC information endpoint
- Mortgage calculations for different payment schedules
- Input validation
- Error handling
- Edge cases for employment types and down payments

### Error Handling
The API handles various error cases including:
- Invalid input validation
- Insufficient down payment
- Property value over maximum limit
- Employment type restrictions

## Tech Stack

- EJS (simple UI for API testing)
- TypeScript
- Express.js
- Jest
- Supertest

## References
- [Ratehub.ca](https://www.ratehub.ca/cmhc-insurance-british-columbia)

