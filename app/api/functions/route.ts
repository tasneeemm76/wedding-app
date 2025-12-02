import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, date, venue } = body

    if (!name) {
      return NextResponse.json({ error: 'Function name is required' }, { status: 400 })
    }

    const functionData: any = {
      name,
      type: type || null,
      venue: venue || null
    }

    if (date) {
      functionData.date = new Date(date)
    }

    const newFunction = await prisma.function.create({
      data: functionData
    })

    return NextResponse.json(newFunction)
  } catch (error: any) {
    console.error('Error creating function:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create function' },
      { status: 500 }
    )
  }
}

