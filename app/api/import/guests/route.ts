import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {

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
    
    // SQLite doesn't support case-insensitive mode, so we check manually
    const allGroups = await prisma.group.findMany()
    const normalizedInput = normalizedGroupName.toLowerCase()
    
    let group = allGroups.find(g => 
      g.name.toLowerCase() === normalizedInput
    )

    if (!group) {
      // Create new group with the exact input (preserving case)
      group = await prisma.group.create({
        data: { name: normalizedGroupName }
      })
    } else {
      // Use existing group (preserve original case in database)
      // group already found above
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

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
      } catch (error: any) {
        errors.push(`Row ${i + 2}: ${error.message || 'Failed to create guest'}`)
        failed++
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors: errors.slice(0, 50) // Limit errors to first 50
    })
  } catch (error: any) {
    console.error('Error importing guests:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import guests' },
      { status: 500 }
    )
  }
}

