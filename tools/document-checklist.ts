import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Document Checklist Generator Tool
 * Generates a comprehensive checklist of documents required for a home loan application.
 */

const commonDocs = [
    'Completed home loan application form',
    'Passport-size photographs',
    'PAN Card (Mandatory)',
    'Identity/Address Proof: Aadhaar, Voter ID, Passport, or Driving License',
    'Bank account statements (last 6 months)',
    'Existing loan statements (if any)',
    'CIBIL consent form',
];

const salariedDocs = [
    'Salary slips (last 3 months)',
    'Form 16 / IT Returns (last 2 years)',
    'Employment certificate / Appointment letter',
    'Company ID card copy',
    'Salary bank account statement (last 6 months showing salary credit)',
    'Bonus / Incentive letters (if applicable)',
];

const selfEmployedProfessionalDocs = [
    'Income Tax Returns (last 3 years) with computation of income',
    'Profit & Loss statement and Balance Sheet (last 3 years, CA certified)',
    'Professional qualification certificates',
    'Registration certificate of practice',
    'Business bank account statement (last 6-12 months)',
    'GST returns (if applicable)',
    'Proof of business existence (last 3 years)',
];

const selfEmployedBusinessDocs = [
    'Income Tax Returns (last 3 years) with computation of income',
    'Profit & Loss statement and Balance Sheet (last 3 years, CA certified)',
    'Business registration certificate / Partnership deed / MOA & AOA',
    'GST registration certificate and returns (last 12 months)',
    'Business bank account statement (last 6-12 months)',
    'Trade license / Shop & Establishment certificate',
    'Proof of business existence (last 5 years preferred)',
    'TDS certificates',
];

const readyPropertyDocs = [
    'Sale agreement / Agreement to sell',
    'Title deed (chain of documents establishing ownership)',
    'Encumbrance certificate (last 13-30 years)',
    'Approved building plan',
    'Occupancy certificate (OC)',
    'Completion certificate (CC)',
    'Society NOC (for resale)',
    'Latest property tax receipt',
    'Allotment letter (if from builder)',
    'Possession letter',
    'No dues certificate from builder/society',
];

const underConstructionDocs = [
    'Allotment letter from builder',
    'Builder-buyer agreement',
    'Approved building plan & layout plan',
    'Commencement certificate',
    'RERA registration certificate',
    'Land title documents of the builder',
    'Payment receipts (amount already paid)',
    'NOC from builder for bank loan',
    'Construction stage-wise payment schedule',
];

const plotDocs = [
    'Sale deed / Agreement to sell',
    'Title deed with chain of ownership',
    'Encumbrance certificate (last 13-30 years)',
    'Approved layout plan',
    'Land use certificate / Conversion order (non-agricultural)',
    'Mutation entries',
    'Tax receipts (last 3 years)',
    'Panchayat / Municipal NOC',
    'Survey map / Demarcation sketch',
    'Construction plan (if plot + construction loan)',
    'Cost estimation from architect (if plot + construction)',
];

export const documentChecklist = new FunctionTool({
    name: 'get_document_checklist',
    description:
        'Generates a comprehensive checklist of all documents required for a home loan application based on the borrower\'s employment type and the type of property being purchased. Employment types: salaried, self-employed professional (doctor/CA/lawyer), self-employed business. Property types: ready-to-move, under-construction, plot/land.',
    parameters: z.object({
        employmentType: z
            .enum(['salaried', 'self_employed_professional', 'self_employed_business'])
            .describe(
                'Type of employment — "salaried", "self_employed_professional" (doctors, CAs, lawyers), or "self_employed_business" (business owners/traders)'
            ),
        propertyType: z
            .enum(['ready', 'under_construction', 'plot'])
            .describe(
                'Type of property — "ready" (ready-to-move-in), "under_construction", or "plot" (land purchase or plot + construction)'
            ),
    }),
    execute: ({ employmentType, propertyType }) => {
        let incomeDocs: string[];
        let employmentLabel: string;

        switch (employmentType) {
            case 'salaried':
                incomeDocs = salariedDocs;
                employmentLabel = 'Salaried Employee';
                break;
            case 'self_employed_professional':
                incomeDocs = selfEmployedProfessionalDocs;
                employmentLabel = 'Self-Employed Professional (Doctor/CA/Lawyer)';
                break;
            case 'self_employed_business':
                incomeDocs = selfEmployedBusinessDocs;
                employmentLabel = 'Self-Employed Business Owner';
                break;
        }

        let propertyDocs: string[];
        let propertyLabel: string;

        switch (propertyType) {
            case 'ready':
                propertyDocs = readyPropertyDocs;
                propertyLabel = 'Ready-to-Move-In Property';
                break;
            case 'under_construction':
                propertyDocs = underConstructionDocs;
                propertyLabel = 'Under-Construction Property';
                break;
            case 'plot':
                propertyDocs = plotDocs;
                propertyLabel = 'Plot / Land Purchase';
                break;
        }

        return {
            status: 'success',
            employmentType: employmentLabel,
            propertyType: propertyLabel,
            sections: {
                identityAndCommonDocuments: commonDocs,
                incomeAndEmploymentDocuments: incomeDocs,
                propertyDocuments: propertyDocs,
            },
            totalDocuments: commonDocs.length + incomeDocs.length + propertyDocs.length,
            tips: [
                'Keep all documents in both physical and scanned (PDF) format.',
                'Bank statements should be stamped or from net banking (with watermark).',
                'Self-attested copies are usually sufficient unless the bank specifies otherwise.',
                'Additional documents may be required based on the bank and loan amount.',
                'If you have a co-applicant, their income and identity documents are also required.',
            ],
        };
    },
});
