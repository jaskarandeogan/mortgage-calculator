console.log('Script loaded');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mortgageForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                propertyPrice: Number(document.getElementById('propertyPrice').value),
                downPayment: Number(document.getElementById('downPayment').value),
                annualInterestRate: Number(document.getElementById('annualInterestRate').value),
                amortizationPeriod: Number(document.getElementById('amortizationPeriod').value),
                paymentSchedule: document.getElementById('paymentSchedule').value,
                isFirstTimeBuyer: document.getElementById('isFirstTimeBuyer').checked,
                isNewConstruction: document.getElementById('isNewConstruction').checked,
                downPaymentSource: document.getElementById('downPaymentSource').value,
                employmentType: document.getElementById('employmentType').value
            };

            try {
                const response = await fetch('/api/mortgage/calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (!response.ok) {
                    displayError(data.errors);
                    return;
                }

                displayResults(data.data);
            } catch (error) {
                displayError(error.message);
            }
        });

        function displayResults(data) {

            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `
            <h2>Mortgage Details</h2>
            <div class="result-item">
                <span>Monthly Payment:</span>
                <span>$${data.paymentAmount.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span>Payment Schedule:</span>
                <span>${data.paymentSchedule}</span>
            </div>
            <div class="result-item">
                <span>CMHC Insurance:</span>
                <span>$${data.cmhcInsurance.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span>Total Amount:</span>
                <span>$${data.totalMortgage.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span>Mortgage Before CMHC:</span>
                <span>$${data.mortgageBeforeCMHC.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span>Downpayment(%):</span>
                <span>$${data.downPaymentPercentage.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span>CMHC Permium Rate(%):</span>
                <span>$${data.cmhcPremiumRate.toFixed(2)}</span>
            </div>
        `;
        }

        function displayError(errors) {
            const resultsDiv = document.getElementById('results');

            if(Array.isArray(errors)) {
                console.log(errors);
            }

            if(Array.isArray(errors)) {
                errors = errors.map(err => {
                    return `<div>${err.message}</div>`;
                });
            }else {
                errors = [errors];
            }

            resultsDiv.innerHTML = `
            <div class="error-message">
                ${errors.join('<br>')}
            </div>
            `;
        }
    }
});


