'use server'

import { prisma } from "lib/prisma";


interface CreateCoinParams {
  marketId: string;
  emojis: string[];
  meta: {
    title: string;
    description: string;
    imageURL: string;
  };
}

export async function createCoin(data: CreateCoinParams) {
  try {
    const coin = await prisma.coinsList.create({
      data: {
        marketId: data.marketId,
        emojis: data.emojis,
        meta: {
          title: data.meta.title,
          description: data.meta.description,
          imageURL: data.meta.imageURL
        }
      }
    });
    return { success: true, data: coin };
  } catch (error) {
    console.error('Failed to create coin:', error);
    return { success: false, error: 'Failed to create coin' };
  }
} 