import mongoose, { Schema, Document } from 'mongoose';

export type SectionType = 'document_list' | 'eligibility' | 'interest_rates_faq';

export interface IBankKnowledge extends Document {
    bankKey: string;
    bankName: string;
    section: SectionType;
    content: string;
    embedding: number[];
    sourceUrl: string;
    scrapedAt: Date;
    processedAt: Date;
}

const BankKnowledgeSchema: Schema = new Schema(
    {
        bankKey: { type: String, required: true },
        bankName: { type: String, required: true },
        section: {
            type: String,
            required: true,
            enum: ['document_list', 'eligibility', 'interest_rates_faq'],
        },
        content: { type: String, required: true },
        embedding: { type: [Number], required: true },
        sourceUrl: { type: String, required: true },
        scrapedAt: { type: Date, required: true },
        processedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound unique index: one document per bank per section
BankKnowledgeSchema.index({ bankKey: 1, section: 1 }, { unique: true });

// Index for quick lookup by bankKey
BankKnowledgeSchema.index({ bankKey: 1 });

export const BankKnowledgeModel = mongoose.model<IBankKnowledge>(
    'BankKnowledge',
    BankKnowledgeSchema
);
