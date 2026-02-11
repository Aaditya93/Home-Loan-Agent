import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Interest Rate Lookup Tool
 * Contains current home loan interest rate data for major Indian banks.
 */

interface BankRate {
    bank: string;
    salaried: { min: number; max: number };
    selfEmployed: { min: number; max: number };
    maxTenure: number;
    maxLoanAmount: string;
    processingFee: string;
    specialOffer?: string;
}

const bankRates: BankRate[] = [
    {
        bank: 'Bank of India',
        salaried: { min: 7.10, max: 9.50 },
        selfEmployed: { min: 7.10, max: 9.50 },
        maxTenure: 30,
        maxLoanAmount: 'Varies',
        processingFee: '0.25% - 1.00%',
    },
    {
        bank: 'HDFC Bank',
        salaried: { min: 7.20, max: 13.20 },
        selfEmployed: { min: 7.20, max: 13.20 },
        maxTenure: 30,
        maxLoanAmount: 'No upper limit',
        processingFee: 'Up to 0.50% or ₹3,000+',
    },
    {
        bank: 'State Bank of India (SBI)',
        salaried: { min: 7.25, max: 9.65 },
        selfEmployed: { min: 7.25, max: 9.85 },
        maxTenure: 30,
        maxLoanAmount: 'No upper limit',
        processingFee: '0.35% (min ₹2,000, max ₹10,000)',
    },
    {
        bank: 'ICICI Bank',
        salaried: { min: 7.65, max: 9.80 },
        selfEmployed: { min: 7.65, max: 9.90 },
        maxTenure: 30,
        maxLoanAmount: 'No upper limit',
        processingFee: '0.50% - 1.00%',
    },
    {
        bank: 'Axis Bank',
        salaried: { min: 8.35, max: 11.90 },
        selfEmployed: { min: 8.35, max: 11.90 },
        maxTenure: 30,
        maxLoanAmount: '₹5 Crore',
        processingFee: 'Up to 1% of loan amount',
    },
    {
        bank: 'Bajaj Housing Finance',
        salaried: { min: 7.15, max: 9.50 },
        selfEmployed: { min: 7.15, max: 9.50 },
        maxTenure: 32,
        maxLoanAmount: 'Varies',
        processingFee: '0.25% - 1.00%',
    },
    {
        bank: 'Kotak Mahindra Bank',
        salaried: { min: 8.70, max: 9.50 },
        selfEmployed: { min: 8.85, max: 9.65 },
        maxTenure: 25,
        maxLoanAmount: '₹10 Crore',
        processingFee: '0.50% of loan amount',
    },
    {
        bank: 'Punjab National Bank (PNB)',
        salaried: { min: 8.45, max: 9.80 },
        selfEmployed: { min: 8.60, max: 10.00 },
        maxTenure: 30,
        maxLoanAmount: 'No upper limit',
        processingFee: '0.35% (max ₹15,000)',
    },
    {
        bank: 'Union Bank of India',
        salaried: { min: 8.35, max: 10.75 },
        selfEmployed: { min: 8.50, max: 10.90 },
        maxTenure: 30,
        maxLoanAmount: 'No upper limit',
        processingFee: '0.50% (max ₹15,000)',
    },
];

export const interestRateLookup = new FunctionTool({
    name: 'lookup_interest_rates',
    description:
        'Looks up current home loan interest rates for major Indian banks. Can filter by a specific bank name or by borrower type (salaried or self-employed). Returns interest rate ranges, processing fees, max tenure, and any special offers.',
    parameters: z.object({
        bankName: z
            .string()
            .optional()
            .describe(
                'Name of a specific bank to look up (e.g., "SBI", "HDFC", "ICICI"). Leave empty to get rates from all banks.'
            ),
        borrowerType: z
            .enum(['salaried', 'self_employed'])
            .optional()
            .describe('Type of borrower — "salaried" or "self_employed". Leave empty to show both.'),
    }),
    execute: ({ bankName, borrowerType }) => {
        let filtered = bankRates;

        if (bankName) {
            const searchTerm = bankName.toLowerCase();
            filtered = bankRates.filter(
                (b) =>
                    b.bank.toLowerCase().includes(searchTerm) ||
                    b.bank
                        .toLowerCase()
                        .replace(/[()]/g, '')
                        .includes(searchTerm)
            );

            if (filtered.length === 0) {
                return {
                    status: 'not_found',
                    message: `No rate data found for "${bankName}". Available banks: ${bankRates.map((b) => b.bank).join(', ')}`,
                };
            }
        }

        const results = filtered.map((b) => {
            const result: Record<string, unknown> = {
                bank: b.bank,
                maxTenure: `${b.maxTenure} years`,
                maxLoanAmount: b.maxLoanAmount,
                processingFee: b.processingFee,
            };

            if (!borrowerType || borrowerType === 'salaried') {
                result.salariedRate = `${b.salaried.min}% - ${b.salaried.max}%`;
            }
            if (!borrowerType || borrowerType === 'self_employed') {
                result.selfEmployedRate = `${b.selfEmployed.min}% - ${b.selfEmployed.max}%`;
            }
            if (b.specialOffer) {
                result.specialOffer = b.specialOffer;
            }

            return result;
        });

        return {
            status: 'success',
            ratesAsOf: 'Early 2026',
            banks: results,
            note: 'Interest rates are floating and linked to the RBI repo rate (external benchmark). actual rates depend on your credit score (750+ preferred), loan amount, and LTV ratio. Processing fees typically range from 0.25% to 2.00% of the loan amount.',
        };
    },
});
