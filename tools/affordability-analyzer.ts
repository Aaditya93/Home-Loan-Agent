import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Affordability Analyzer Tool
 * Determines how much property a user can afford based on their financial situation.
 */
export const affordabilityAnalyzer = new FunctionTool({
    name: 'analyze_affordability',
    description:
        'Calculates the maximum property price a user can afford based on their monthly income, monthly expenses, savings available for down payment, expected interest rate, and loan tenure. Considers the recommended 20% down payment, loan eligibility, and stamp duty/registration costs.',
    parameters: z.object({
        monthlyIncome: z
            .number()
            .describe('Gross monthly income in INR. Must be greater than 0 (e.g., 150000 for ₹1.5 lakh)'),
        monthlyExpenses: z
            .number()
            .describe('Total fixed monthly expenses including existing EMIs in INR (e.g., 50000). 0 or more.'),
        savingsForDownPayment: z
            .number()
            .optional()
            .describe('One-time savings available for down payment in INR (e.g., 1000000 for ₹10 lakhs). If not provided, assumes you have enough for 20% down payment.'),
        annualInterestRate: z
            .number()
            .optional()
            .describe('Expected annual interest rate as a percentage (e.g., 8.5). Default: 8.5%'),
        tenureYears: z
            .number()
            .optional()
            .describe('Desired loan tenure in years (e.g., 20). Default: 20 years'),
    }),
    execute: ({
        monthlyIncome,
        monthlyExpenses,
        savingsForDownPayment,
        annualInterestRate,
        tenureYears,
    }) => {
        const rate = annualInterestRate ?? 8.5;
        const tenure = tenureYears ? Math.round(tenureYears) : 20;
        const monthlyRate = rate / 12 / 100;
        const totalMonths = tenure * 12;

        const maxFoirEmi = monthlyIncome * 0.5;
        const availableForEmi = Math.max(0, maxFoirEmi - monthlyExpenses);

        if (availableForEmi <= 0) {
            return {
                status: 'not_affordable',
                message: 'Your monthly expenses already exceed 50% of your income. Reduce expenses or increase income before taking a home loan.',
                monthlyIncome,
                monthlyExpenses,
                maxAllowableEmi: maxFoirEmi,
            };
        }

        const onePlusR = Math.pow(1 + monthlyRate, totalMonths);
        const maxLoanAmount = (availableForEmi * (onePlusR - 1)) / (monthlyRate * onePlusR);

        const ltvRatio = 0.80;
        const maxPropertyFromLoan = maxLoanAmount / ltvRatio;

        let maxPropertyFromSavings: number | undefined;
        if (savingsForDownPayment !== undefined) {
            const downPaymentPercent = 0.20;
            maxPropertyFromSavings = savingsForDownPayment / (downPaymentPercent + 0.07);
        }

        let maxPropertyPrice: number;
        let limitingFactor: string;

        if (maxPropertyFromSavings !== undefined && maxPropertyFromSavings < maxPropertyFromLoan) {
            maxPropertyPrice = maxPropertyFromSavings;
            limitingFactor = 'Your available savings for down payment is the limiting factor.';
        } else {
            maxPropertyPrice = maxPropertyFromLoan;
            limitingFactor = 'Your EMI capacity (income-based) is the limiting factor.';
        }

        const loanNeeded = maxPropertyPrice * ltvRatio;
        const downPayment = maxPropertyPrice * 0.20;
        const estimatedStampDutyReg = maxPropertyPrice * 0.07;
        const actualEmi = (loanNeeded * monthlyRate * onePlusR) / (onePlusR - 1);

        return {
            status: 'success',
            maxPropertyPrice: Math.round(maxPropertyPrice),
            formattedMaxProperty: `₹${Math.round(maxPropertyPrice).toLocaleString('en-IN')}`,
            maxPropertyInLakhs: `₹${(maxPropertyPrice / 100000).toFixed(2)} Lakhs`,
            breakdown: {
                loanAmount: Math.round(loanNeeded),
                formattedLoan: `₹${Math.round(loanNeeded).toLocaleString('en-IN')} (${(ltvRatio * 100)}% LTV)`,
                downPayment: Math.round(downPayment),
                formattedDownPayment: `₹${Math.round(downPayment).toLocaleString('en-IN')} (20%)`,
                estimatedStampDutyAndRegistration: Math.round(estimatedStampDutyReg),
                formattedStampDuty: `₹${Math.round(estimatedStampDutyReg).toLocaleString('en-IN')} (~7% estimate)`,
                totalUpfrontCost: Math.round(downPayment + estimatedStampDutyReg),
                formattedUpfront: `₹${Math.round(downPayment + estimatedStampDutyReg).toLocaleString('en-IN')}`,
            },
            monthlyEmi: Math.round(actualEmi),
            formattedEmi: `₹${Math.round(actualEmi).toLocaleString('en-IN')}/month`,
            emiToIncomeRatio: `${((actualEmi / monthlyIncome) * 100).toFixed(1)}%`,
            limitingFactor,
            assumptions: {
                interestRate: `${rate}%`,
                tenure: `${tenure} years`,
                ltvRatio: '80% (bank finances 80% of property value)',
                stampDutyEstimate: '~7% (varies by state)',
            },
        };
    },
});
