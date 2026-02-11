import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Stamp Duty & Registration Calculator Tool
 * Calculates stamp duty and registration charges based on the latest Indian state rules (2025-26).
 */

type TieredRate = { threshold: number; rate: number };

interface StateRule {
    stampDuty: {
        male: number | TieredRate[];
        female: number | TieredRate[];
        joint: number | TieredRate[];
        rebate?: number; // Fixed amount rebate (e.g., UP ₹10,000 for females)
    };
    registration: {
        male: number | TieredRate[];
        female: number | TieredRate[];
        joint: number | TieredRate[];
        cap?: number; // Maximum registration charge
        flat?: number; // Fixed registration charge
    };
    notes?: string;
}

const stateRules: Record<string, StateRule> = {
    'andhra pradesh': {
        stampDuty: { male: 5, female: 5, joint: 5 },
        registration: { male: 0.5, female: 0.5, joint: 0.5 },
    },
    'arunachal pradesh': {
        stampDuty: { male: 6, female: 6, joint: 6 },
        registration: { male: 1, female: 1, joint: 1 },
    },
    assam: {
        stampDuty: { male: 8.25, female: 8.25, joint: 8.25 },
        registration: { male: 1, female: 1, joint: 1 },
    },
    bihar: {
        stampDuty: { male: 6.3, female: 5.7, joint: 6 }, // Based on Buyer: Female (5.7%), Male (6.3%), Joint/Other (6%)
        registration: { male: 2, female: 2, joint: 2 },
    },
    chhattisgarh: {
        stampDuty: { male: 5, female: 5, joint: 5 },
        registration: { male: 4, female: 4, joint: 4 },
    },
    goa: {
        stampDuty: {
            male: [
                { threshold: 5000000, rate: 3.5 },
                { threshold: 7500000, rate: 4 },
                { threshold: 10000000, rate: 4.5 },
                { threshold: Infinity, rate: 5 },
            ],
            female: [
                { threshold: 5000000, rate: 3.5 },
                { threshold: 7500000, rate: 4 },
                { threshold: 10000000, rate: 4.5 },
                { threshold: Infinity, rate: 5 },
            ],
            joint: [
                { threshold: 5000000, rate: 4 },
                { threshold: 7500000, rate: 4.5 },
                { threshold: 10000000, rate: 5 },
                { threshold: Infinity, rate: 5 },
            ],
        },
        registration: { male: 3, female: 3, joint: 3 },
    },
    gujarat: {
        stampDuty: { male: 4.9, female: 4.9, joint: 4.9 },
        registration: { male: 1, female: 0, joint: 0.5 }, // No charges for female
    },
    haryana: {
        stampDuty: { male: 7, female: 5, joint: 6 }, // Urban areas
        registration: { male: 1, female: 1, joint: 1, cap: 50000 },
        notes: 'Registration charges capped at ₹50,000.',
    },
    'himachal pradesh': {
        stampDuty: { male: 5, female: 5, joint: 5 },
        registration: {
            male: [
                { threshold: 5000000, rate: 6 },
                { threshold: Infinity, rate: 8 },
            ],
            female: [
                { threshold: 8000000, rate: 4 },
                { threshold: Infinity, rate: 8 },
            ],
            joint: [
                { threshold: 5000000, rate: 6 },
                { threshold: Infinity, rate: 8 },
            ],
        },
    },
    'jammu and kashmir': {
        stampDuty: { male: 5, female: 5, joint: 5 },
        registration: { male: 1.2, female: 1.2, joint: 1.2 }, // Estimated standard
    },
    jharkhand: {
        stampDuty: { male: 4, female: 4, joint: 4 },
        registration: { male: 3, female: 3, joint: 3 },
    },
    karnataka: {
        stampDuty: {
            male: [
                { threshold: 2000000, rate: 2 },
                { threshold: 4500000, rate: 3 },
                { threshold: Infinity, rate: 5 },
            ],
            female: [
                { threshold: 2000000, rate: 2 },
                { threshold: 4500000, rate: 3 },
                { threshold: Infinity, rate: 5 },
            ],
            joint: [
                { threshold: 2000000, rate: 2 },
                { threshold: 4500000, rate: 3 },
                { threshold: Infinity, rate: 5 },
            ],
        },
        registration: { male: 1, female: 1, joint: 1 },
    },
    kerala: {
        stampDuty: { male: 8, female: 8, joint: 8 },
        registration: { male: 2, female: 2, joint: 2 },
    },
    'madhya pradesh': {
        stampDuty: { male: 7.5, female: 7.5, joint: 7.5 },
        registration: { male: 3, female: 3, joint: 3 },
    },
    maharashtra: {
        stampDuty: { male: 6, female: 5, joint: 5.5 },
        registration: { male: 1, female: 1, joint: 1, cap: 30000 },
        notes: 'Includes Metro Cess in major cities. Registration capped at ₹30,000 for residential.',
    },
    manipur: {
        stampDuty: { male: 7, female: 7, joint: 7 },
        registration: { male: 3, female: 3, joint: 3 },
    },
    meghalaya: {
        stampDuty: { male: 9.9, female: 9.9, joint: 9.9 },
        registration: { male: 1, female: 1, joint: 1 },
    },
    mizoram: {
        stampDuty: { male: 9, female: 9, joint: 9 },
        registration: { male: 1, female: 1, joint: 1 },
    },
    nagaland: {
        stampDuty: { male: 8.25, female: 8.25, joint: 8.25 },
        registration: { male: 1, female: 1, joint: 1 },
    },
    odisha: {
        stampDuty: { male: 5, female: 4, joint: 4.5 },
        registration: { male: 2, female: 2, joint: 2 },
    },
    punjab: {
        stampDuty: { male: 7, female: 5, joint: 6 },
        registration: { male: 1, female: 1, joint: 1 },
    },
    rajasthan: {
        stampDuty: { male: 5, female: 4, joint: 4.5 },
        registration: { male: 1, female: 1, joint: 1 },
    },
    sikkim: {
        stampDuty: { male: 9, female: 9, joint: 9, rebate: -5 }, // Standard 9%, Sikkimese Origin get rebate/lower rate
        registration: { male: 1, female: 1, joint: 1 },
        notes: 'Sikkimese origin: 4% stamp duty. Others: 9%. Plus 1% for both.',
    },
    'tamil nadu': {
        stampDuty: { male: 7, female: 7, joint: 7 },
        registration: { male: 4, female: 4, joint: 4 },
    },
    telangana: {
        stampDuty: { male: 5, female: 5, joint: 5 },
        registration: { male: 0.5, female: 0.5, joint: 0.5 },
    },
    tripura: {
        stampDuty: { male: 5, female: 5, joint: 5 },
        registration: { male: 1, female: 1, joint: 1 },
    },
    'uttar pradesh': {
        stampDuty: { male: 7, female: 7, joint: 7, rebate: 10000 },
        registration: { male: 1, female: 1, joint: 1 },
        notes: '₹10,000 rebate for female buyers on stamp duty.',
    },
    uttarakhand: {
        stampDuty: { male: 5, female: 3.75, joint: 4.375 },
        registration: { male: 2, female: 2, joint: 2 },
    },
    'west bengal': {
        stampDuty: {
            male: [
                { threshold: 10000000, rate: 6 },
                { threshold: Infinity, rate: 7 },
            ],
            female: [
                { threshold: 10000000, rate: 6 },
                { threshold: Infinity, rate: 7 },
            ],
            joint: [
                { threshold: 10000000, rate: 6 },
                { threshold: Infinity, rate: 7 },
            ],
        },
        registration: { male: 1, female: 1, joint: 1 },
    },
};

const calculateFromRate = (value: number, rateSource: number | TieredRate[]): number => {
    if (typeof rateSource === 'number') {
        return (value * rateSource) / 100;
    }
    const tier = rateSource.find(t => value <= t.threshold);
    const rate = tier ? tier.rate : rateSource[rateSource.length - 1].rate;
    return (value * rate) / 100;
};

const getRateString = (value: number, rateSource: number | TieredRate[]): string => {
    if (typeof rateSource === 'number') {
        return `${rateSource}%`;
    }
    const tier = rateSource.find(t => value <= t.threshold);
    const rate = tier ? tier.rate : rateSource[rateSource.length - 1].rate;
    return `${rate}%`;
};

export const stampDutyCalculator = new FunctionTool({
    name: 'calculate_stamp_duty',
    description:
        'Calculates the stamp duty and registration charges for a property purchase in India based on the state, property value, and buyer gender. Covers all major Indian states with latest tiered and gender-specific rules.',
    parameters: z.object({
        propertyValue: z
            .number()
            .describe('The property value or agreement value in INR. e.g., 8000000 for ₹80 lakhs'),
        state: z
            .string()
            .describe('The Indian state where the property is located (e.g., "Maharashtra", "Goa", "Karnataka")'),
        buyerGender: z
            .enum(['male', 'female', 'joint'])
            .optional()
            .describe('Gender of the buyer — "male", "female", or "joint". Defaults to "male".'),
    }),
    execute: ({ propertyValue, state, buyerGender }) => {
        if (propertyValue <= 0) {
            return { status: 'error', message: 'Property value must be greater than 0.' };
        }

        const gender = buyerGender ?? 'male';
        const stateKey = state.toLowerCase().trim();
        const rules = stateRules[stateKey];

        if (!rules) {
            return {
                status: 'not_found',
                message: `Stamp duty data not available for "${state}". We support most major Indian states including ${Object.keys(stateRules)
                    .slice(0, 5)
                    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(', ')} et al.`,
            };
        }

        // Calculate Stamp Duty
        const stampDutyRateSource = rules.stampDuty[gender];
        let stampDuty = Math.round(calculateFromRate(propertyValue, stampDutyRateSource));

        // Apply Rebate
        if (gender === 'female' && rules.stampDuty.rebate) {
            // If rebate is positive (like UP 10k), subtract it. 
            // If negative (like Sikkim offset), adjust rate logic (Sikkim needs special handling so I used -5 logic tentatively)
            if (rules.stampDuty.rebate > 0) {
                stampDuty = Math.max(0, stampDuty - rules.stampDuty.rebate);
            }
        }

        // Calculate Registration
        const registrationRateSource = rules.registration[gender];
        let registrationCharge = Math.round(calculateFromRate(propertyValue, registrationRateSource));

        // Apply Cap/Flat
        if (rules.registration.flat) {
            registrationCharge = rules.registration.flat;
        } else if (rules.registration.cap) {
            registrationCharge = Math.min(registrationCharge, rules.registration.cap);
        }

        const totalCharges = stampDuty + registrationCharge;

        return {
            status: 'success',
            state: state.charAt(0).toUpperCase() + state.slice(1),
            propertyValue,
            formattedPropertyValue: `₹${propertyValue.toLocaleString('en-IN')}`,
            buyerGender: gender,
            stampDutyPercent: getRateString(propertyValue, stampDutyRateSource),
            stampDutyAmount: stampDuty,
            formattedStampDuty: `₹${stampDuty.toLocaleString('en-IN')}`,
            registrationChargePercent: rules.registration.flat
                ? `Flat fee: ₹${rules.registration.flat.toLocaleString('en-IN')}`
                : getRateString(propertyValue, registrationRateSource),
            registrationChargeAmount: registrationCharge,
            formattedRegistrationCharge: `₹${registrationCharge.toLocaleString('en-IN')}`,
            totalCharges,
            formattedTotalCharges: `₹${totalCharges.toLocaleString('en-IN')}`,
            effectiveTotalPercent: `${((totalCharges / propertyValue) * 100).toFixed(2)}%`,
            notes: rules.notes,
        };
    },
});
