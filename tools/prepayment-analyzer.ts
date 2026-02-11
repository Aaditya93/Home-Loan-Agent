import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Prepayment / Foreclosure Analyzer Tool
 * Analyzes the impact of a lump-sum prepayment on a home loan.
 */
export const prepaymentAnalyzer = new FunctionTool({
    name: 'analyze_prepayment',
    description:
        'Analyzes the impact of making a lump-sum prepayment on a home loan. Shows how much interest is saved, how much the tenure is reduced, or what the new EMI would be after prepayment. Supports two modes: reduce tenure (keep EMI same) or reduce EMI (keep tenure same).',
    parameters: z.object({
        originalPrincipal: z
            .number()
            .describe('Original loan principal amount in INR. Must be greater than 0 (e.g., 4000000 for ₹40 lakhs)'),
        annualInterestRate: z
            .number()
            .describe('Annual interest rate as a percentage, between 1 and 30 (e.g., 8.5)'),
        originalTenureYears: z
            .number()
            .describe('Original loan tenure in years, between 1 and 30 (e.g., 20)'),
        yearsCompleted: z
            .number()
            .describe('Number of years of EMI already paid (e.g., 2 or 2.5). Must be 0 or more.'),
        prepaymentAmount: z
            .number()
            .describe('Lump-sum prepayment amount in INR. Must be greater than 0 (e.g., 500000 for ₹5 lakhs)'),
        mode: z
            .enum(['reduce_tenure', 'reduce_emi'])
            .optional()
            .describe(
                '"reduce_tenure" keeps EMI same but shortens loan duration (default). "reduce_emi" keeps tenure same but lowers monthly EMI.'
            ),
    }),
    execute: ({
        originalPrincipal,
        annualInterestRate,
        originalTenureYears,
        yearsCompleted,
        prepaymentAmount,
        mode,
    }) => {
        const prepayMode = mode ?? 'reduce_tenure';
        const monthlyRate = annualInterestRate / 12 / 100;
        const originalTotalMonths = Math.round(originalTenureYears) * 12;
        const monthsCompleted = Math.round(yearsCompleted * 12);
        const remainingMonthsBeforePrepay = originalTotalMonths - monthsCompleted;

        if (remainingMonthsBeforePrepay <= 0) {
            return {
                status: 'error',
                message: 'The loan tenure has already been completed based on the years specified.',
            };
        }

        // Calculate original EMI
        const onePlusROriginal = Math.pow(1 + monthlyRate, originalTotalMonths);
        const originalEmi = (originalPrincipal * monthlyRate * onePlusROriginal) / (onePlusROriginal - 1);

        // Calculate outstanding principal after monthsCompleted
        let outstandingPrincipal = originalPrincipal;
        for (let i = 0; i < monthsCompleted; i++) {
            const interestComponent = outstandingPrincipal * monthlyRate;
            const principalComponent = originalEmi - interestComponent;
            outstandingPrincipal -= principalComponent;
        }

        if (prepaymentAmount >= outstandingPrincipal) {
            return {
                status: 'success',
                message: 'The prepayment amount is enough to close the entire loan!',
                outstandingPrincipal: Math.round(outstandingPrincipal),
                formattedOutstanding: `₹${Math.round(outstandingPrincipal).toLocaleString('en-IN')}`,
                prepaymentAmount,
                loanClosedEarly: true,
            };
        }

        const newOutstanding = outstandingPrincipal - prepaymentAmount;

        // Total interest WITHOUT prepayment (remaining)
        const totalWithoutPrepay = originalEmi * remainingMonthsBeforePrepay;
        const interestWithoutPrepay = totalWithoutPrepay - outstandingPrincipal;

        if (prepayMode === 'reduce_tenure') {
            const denominator = originalEmi - newOutstanding * monthlyRate;
            if (denominator <= 0) {
                return {
                    status: 'error',
                    message: 'Unable to compute — the EMI does not cover interest on remaining principal.',
                };
            }
            const newTotalMonths = Math.ceil(
                Math.log(originalEmi / denominator) / Math.log(1 + monthlyRate)
            );
            const totalWithPrepay = originalEmi * newTotalMonths;
            const interestWithPrepay = totalWithPrepay - newOutstanding;
            const interestSaved = interestWithoutPrepay - interestWithPrepay;
            const tenureReduction = remainingMonthsBeforePrepay - newTotalMonths;

            return {
                status: 'success',
                mode: 'reduce_tenure',
                outstandingBeforePrepay: Math.round(outstandingPrincipal),
                newOutstandingAfterPrepay: Math.round(newOutstanding),
                originalEmi: Math.round(originalEmi),
                formattedEmi: `₹${Math.round(originalEmi).toLocaleString('en-IN')} (unchanged)`,
                remainingMonthsBefore: remainingMonthsBeforePrepay,
                remainingMonthsAfter: newTotalMonths,
                tenureReduced: `${tenureReduction} months (~${(tenureReduction / 12).toFixed(1)} years)`,
                interestSaved: Math.round(interestSaved),
                formattedInterestSaved: `₹${Math.round(interestSaved).toLocaleString('en-IN')}`,
                newLoanEndDate: `Loan now ends ${tenureReduction} months earlier`,
            };
        } else {
            const onePlusRNew = Math.pow(1 + monthlyRate, remainingMonthsBeforePrepay);
            const newEmi = (newOutstanding * monthlyRate * onePlusRNew) / (onePlusRNew - 1);
            const totalWithPrepay = newEmi * remainingMonthsBeforePrepay;
            const interestWithPrepay = totalWithPrepay - newOutstanding;
            const interestSaved = interestWithoutPrepay - interestWithPrepay;
            const emiReduction = originalEmi - newEmi;

            return {
                status: 'success',
                mode: 'reduce_emi',
                outstandingBeforePrepay: Math.round(outstandingPrincipal),
                newOutstandingAfterPrepay: Math.round(newOutstanding),
                originalEmi: Math.round(originalEmi),
                newEmi: Math.round(newEmi),
                emiReduction: Math.round(emiReduction),
                formattedOriginalEmi: `₹${Math.round(originalEmi).toLocaleString('en-IN')}`,
                formattedNewEmi: `₹${Math.round(newEmi).toLocaleString('en-IN')}`,
                formattedEmiReduction: `₹${Math.round(emiReduction).toLocaleString('en-IN')}/month saved`,
                remainingMonths: remainingMonthsBeforePrepay,
                interestSaved: Math.round(interestSaved),
                formattedInterestSaved: `₹${Math.round(interestSaved).toLocaleString('en-IN')}`,
            };
        }
    },
});
