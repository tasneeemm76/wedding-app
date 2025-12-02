import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, date, venue } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type || null
    if (venue !== undefined) updateData.venue = venue || null
    if (date !== undefined) updateData.date = date ? new Date(date) : null

    const updatedFunction = await prisma.function.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedFunction)
  } catch (error: any) {
    console.error('Error updating function:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update function' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.function.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting function:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete function' },
      { status: 500 }
    )
  }
}

