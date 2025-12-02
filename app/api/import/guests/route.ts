import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

interface ErrorResponse {
  error: string
}

// Environment-safe error message helper
function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    if (process.env.NODE_ENV === 'production') {
      return defaultMessage
    }
    return error.message
  }
  return defaultMessage
}

export async function POST(
  request: NextRequest
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const groupNameInput = formData.get('groupName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!groupNameInput || !groupNameInput.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Normalize and find or create group (case-insensitive)
    const normalizedGroupName = groupNameInput.trim()
    
    // Use PostgreSQL case-insensitive search to find existing group
    let group = await prisma.group.findFirst({
      where: {
        name: {
          equals: normalizedGroupName,
          mode: 'insensitive'
        }
      }
    })

    if (!group) {
      // Create new group with the exact input (preserving case)
      group = await prisma.group.create({
        data: { name: normalizedGroupName }
      })
    }

    // Validate file size (limit to 10MB to mitigate DoS risks)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    
    // Limit workbook parsing to mitigate ReDoS and prototype pollution risks
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: false,
      cellNF: false,
      cellStyles: false,
      sheetStubs: false
    })
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: 'Invalid Excel file: no sheets found' },
        { status: 400 }
      )
    }
    
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Invalid Excel file: sheet not found' },
        { status: 400 }
      )
    }
    
    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false
    })
    
    // Limit number of rows to process (mitigate DoS)
    const MAX_ROWS = 10000
    if (data.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `File contains too many rows. Maximum ${MAX_ROWS} rows allowed.` },
        { status: 400 }
      )
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      
      // Skip rows with blank names
      if (!row.name || String(row.name).trim() === '') {
        errors.push(`Row ${i + 2}: Skipped - blank name`)
        failed++
        continue
      }

      try {
        const name = String(row.name).trim()
        const ladies = parseInt(row.ladies) || 0
        const gents = parseInt(row.gents) || 0
        const children = parseInt(row.children) || 0

        await prisma.guest.create({
          data: {
            name,
            ladies: Math.max(0, ladies),
            gents: Math.max(0, gents),
            children: Math.max(0, children),
            groupId: group.id
          }
        })

        success++
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to create guest')
        errors.push(`Row ${i + 2}: ${message}`)
        failed++
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors: errors.slice(0, 50) // Limit errors to first 50
    })
  } catch (error) {
    console.error('Error importing guests:', error)
    
    // Handle file parsing errors
    if (error instanceof Error && (
      error.message.includes('Cannot read') ||
      error.message.includes('Invalid') ||
      error.message.includes('corrupt')
    )) {
      return NextResponse.json(
        { error: 'Invalid or corrupted Excel file' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to import guests') },
      { status: 500 }
    )
  }
}

