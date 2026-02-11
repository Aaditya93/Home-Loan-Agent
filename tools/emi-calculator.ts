import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * EMI Calculator Tool
 * Uses standard formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 */
export const emiCalculator = new FunctionTool({
    name: 'calculate_emi',
    description:
        'Calculates the Equated Monthly Installment (EMI) for a home loan given the principal amount, annual interest rate, and loan tenure in years. Returns the monthly EMI, total interest payable, and total amount payable.',
    parameters: z.object({
        principal: z
            .number()
            .describe('The loan principal amount in INR. Must be greater than 0 (e.g., 5000000 for ₹50 lakhs)'),
        annualInterestRate: z
            .number()
            .describe('The annual interest rate as a percentage, between 1 and 30 (e.g., 8.5 for 8.5%)'),
        tenureYears: z
            .number()
            .describe('The loan tenure in years, between 1 and 30 (e.g., 20)'),
    }),
    execute: ({ principal, annualInterestRate, tenureYears }) => {
        const monthlyRate = annualInterestRate / 12 / 100;
        const totalMonths = Math.round(tenureYears) * 12;
        const onePlusR = Math.pow(1 + monthlyRate, totalMonths);

        const emi = (principal * monthlyRate * onePlusR) / (onePlusR - 1);
        const totalPayable = emi * totalMonths;
        const totalInterest = totalPayable - principal;

        return {
            status: 'success',
            monthlyEmi: Math.round(emi),
            totalInterestPayable: Math.round(totalInterest),
            totalAmountPayable: Math.round(totalPayable),
            principal,
            annualInterestRate,
            tenureYears: Math.round(tenureYears),
            totalMonths,
            formattedEmi: `₹${Math.round(emi).toLocaleString('en-IN')}`,
            formattedTotalInterest: `₹${Math.round(totalInterest).toLocaleString('en-IN')}`,
            formattedTotalPayable: `₹${Math.round(totalPayable).toLocaleString('en-IN')}`,
        };
    },
});
