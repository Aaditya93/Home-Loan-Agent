import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Loan Eligibility Checker Tool
 * Uses FOIR (Fixed Obligations to Income Ratio) to determine max eligible loan amount.
 */
export const eligibilityChecker = new FunctionTool({
    name: 'check_loan_eligibility',
    description:
        'Estimates the maximum home loan amount a person is eligible for based on their monthly income, existing EMI obligations, expected interest rate, and desired loan tenure. Uses the FOIR (Fixed Obligations to Income Ratio) method used by Indian banks.',
    parameters: z.object({
        monthlyIncome: z
            .number()
            .describe('Gross monthly income in INR (e.g., 120000 for ₹1.2 lakh). Must be greater than 0.'),
        existingEmis: z
            .number()
            .describe('Total of all existing monthly EMI obligations in INR (e.g., 15000). Pass 0 if none.'),
        annualInterestRate: z
            .number()
            .describe('Expected annual interest rate as a percentage, between 1 and 30 (e.g., 8.5)'),
        tenureYears: z
            .number()
            .describe('Desired loan tenure in years, between 1 and 30 (e.g., 20)'),
        applicantAge: z
            .number()
            .optional()
            .describe('Age of the applicant in years, between 18 and 75 (optional, used to cap max tenure). Default assumes 35.'),
    }),
    execute: ({ monthlyIncome, existingEmis, annualInterestRate, tenureYears, applicantAge }) => {
        const age = applicantAge ? Math.round(applicantAge) : 35;
        const retirementAge = 75;
        const maxTenureByAge = Math.max(5, retirementAge - age);
        const effectiveTenure = Math.min(Math.round(tenureYears), maxTenureByAge, 30);

        const foirPercent = 55;
        const maxTotalEmi = (monthlyIncome * foirPercent) / 100;
        const availableEmiCapacity = Math.max(0, maxTotalEmi - existingEmis);

        if (availableEmiCapacity <= 0) {
            return {
                status: 'ineligible',
                reason: 'Your existing EMI obligations exceed the maximum allowable limit (55% of income). Consider reducing existing debts before applying.',
                monthlyIncome,
                existingEmis,
                maxAllowableEmi: maxTotalEmi,
            };
        }

        const monthlyRate = annualInterestRate / 12 / 100;
        const totalMonths = effectiveTenure * 12;
        const onePlusR = Math.pow(1 + monthlyRate, totalMonths);

        const maxLoanAmount = (availableEmiCapacity * (onePlusR - 1)) / (monthlyRate * onePlusR);
        const emi = availableEmiCapacity;

        return {
            status: 'eligible',
            maxLoanAmount: Math.round(maxLoanAmount),
            formattedMaxLoan: `₹${Math.round(maxLoanAmount).toLocaleString('en-IN')}`,
            maxLoanAmountInLakhs: `₹${(maxLoanAmount / 100000).toFixed(2)} Lakhs`,
            recommendedEmi: Math.round(emi),
            formattedEmi: `₹${Math.round(emi).toLocaleString('en-IN')}`,
            effectiveTenure,
            foirPercent,
            monthlyIncome,
            existingEmis,
            availableEmiCapacity: Math.round(availableEmiCapacity),
            ltvGuide: 'Loan amount is also subject to LTV (Loan-to-Value) ratios: 90% for loans up to ₹30 Lakh, 80% for ₹30L-₹75L, and 75% for loans above ₹75 Lakh.',
            notes: effectiveTenure < Math.round(tenureYears)
                ? `Tenure capped at ${effectiveTenure} years based on max age of ${retirementAge} (applicant age: ${age}).`
                : undefined,
        };
    },
});
