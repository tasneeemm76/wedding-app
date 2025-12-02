import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    // Delete all guests
    const result = await prisma.guest.deleteMany({})

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    })
  } catch (error: any) {
    console.error('Error deleting all guests:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete all guests' },
      { status: 500 }
    )
  }
}


