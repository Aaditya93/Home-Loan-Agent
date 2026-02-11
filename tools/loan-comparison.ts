import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Loan Comparison Tool
 * Compares multiple loan offers side-by-side and ranks them.
 */
export const loanComparison = new FunctionTool({
    name: 'compare_loans',
    description:
        'Compares two or more home loan offers side-by-side. For each offer, calculates the EMI, total interest, total cost, and effective cost. Ranks the offers from best to worst based on total cost. Useful when users are deciding between multiple bank offers or loan structures.',
    parameters: z.object({
        loanOffers: z
            .array(
                z.object({
                    label: z
                        .string()
                        .describe('A label for this offer (e.g., "SBI Offer", "HDFC Offer", or "Option A")'),
                    principal: z
                        .number()
                        .describe('Loan amount in INR. Must be greater than 0.'),
                    annualInterestRate: z
                        .number()
                        .describe('Annual interest rate as a percentage (e.g., 8.5)'),
                    tenureYears: z
                        .number()
                        .describe('Loan tenure in years, between 1 and 30'),
                    processingFeePercent: z
                        .number()
                        .optional()
                        .describe('Processing fee as a percentage of loan amount (e.g., 0.5). Default: 0'),
                })
            )
            .describe('Array of loan offers to compare (minimum 2, maximum 5)'),
    }),
    execute: ({ loanOffers }) => {
        const results = loanOffers.map((offer) => {
            const monthlyRate = offer.annualInterestRate / 12 / 100;
            const totalMonths = Math.round(offer.tenureYears) * 12;
            const onePlusR = Math.pow(1 + monthlyRate, totalMonths);

            const emi = (offer.principal * monthlyRate * onePlusR) / (onePlusR - 1);
            const totalPayable = emi * totalMonths;
            const totalInterest = totalPayable - offer.principal;

            const processingFee = offer.processingFeePercent
                ? Math.round((offer.principal * offer.processingFeePercent) / 100)
                : 0;

            const totalCost = totalPayable + processingFee;

            return {
                label: offer.label,
                principal: offer.principal,
                formattedPrincipal: `₹${offer.principal.toLocaleString('en-IN')}`,
                interestRate: `${offer.annualInterestRate}%`,
                tenure: `${Math.round(offer.tenureYears)} years (${totalMonths} months)`,
                monthlyEmi: Math.round(emi),
                formattedEmi: `₹${Math.round(emi).toLocaleString('en-IN')}/month`,
                totalInterest: Math.round(totalInterest),
                formattedTotalInterest: `₹${Math.round(totalInterest).toLocaleString('en-IN')}`,
                processingFee,
                formattedProcessingFee: processingFee > 0 ? `₹${processingFee.toLocaleString('en-IN')}` : 'None',
                totalCost: Math.round(totalCost),
                formattedTotalCost: `₹${Math.round(totalCost).toLocaleString('en-IN')}`,
                interestToLoanRatio: `${((totalInterest / offer.principal) * 100).toFixed(1)}%`,
            };
        });

        const ranked = [...results].sort((a, b) => a.totalCost - b.totalCost);

        const worstCost = ranked[ranked.length - 1].totalCost;
        const rankedWithSavings = ranked.map((r, index) => ({
            rank: index + 1,
            ...r,
            savingsVsWorst:
                index < ranked.length - 1
                    ? `₹${(worstCost - r.totalCost).toLocaleString('en-IN')} saved vs worst option`
                    : 'Most expensive option',
        }));

        return {
            status: 'success',
            comparison: rankedWithSavings,
            recommendation: `Best option: ${ranked[0].label} with total cost of ${ranked[0].formattedTotalCost} and EMI of ${ranked[0].formattedEmi}.`,
            savingsBestVsWorst: `Choosing the best option saves ₹${(worstCost - ranked[0].totalCost).toLocaleString('en-IN')} over the loan lifetime.`,
        };
    },
});
