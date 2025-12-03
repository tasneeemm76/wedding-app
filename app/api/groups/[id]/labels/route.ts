import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ErrorResponse {
  error: string
}

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    if (process.env.NODE_ENV === 'production') {
      return defaultMessage
    }
    return error.message
  }
  return defaultMessage
}

// Add label to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const { id: groupId } = await params
    const body = await request.json()
    const { labelId } = body

    if (!labelId) {
      return NextResponse.json(
        { error: 'Label ID is required' },
        { status: 400 }
      )
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if label exists
    const label = await prisma.label.findUnique({
      where: { id: labelId }
    })

    if (!label) {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      )
    }

    // Create the relationship
    const groupLabel = await prisma.groupLabel.create({
      data: {
        groupId,
        labelId
      },
      include: {
        label: true
      }
    })

    return NextResponse.json(groupLabel, { status: 201 })
  } catch (error: any) {
    console.error('Error adding label to group:', error)
    
    // Handle unique constraint violation (label already added)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Label is already added to this group' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to add label to group') },
      { status: 500 }
    )
  }
}

// Remove label from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const labelId = searchParams.get('labelId')

    if (!labelId) {
      return NextResponse.json(
        { error: 'Label ID is required' },
        { status: 400 }
      )
    }

    await prisma.groupLabel.delete({
      where: {
        groupId_labelId: {
          groupId,
          labelId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing label from group:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Label not found on this group' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to remove label from group') },
      { status: 500 }
    )
  }
}

