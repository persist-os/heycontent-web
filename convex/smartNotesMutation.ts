import { internalMutation } from "./_generated/server";

// Valid new note types
type NewNoteType = "idea_bank" | "content_script" | "collaboration_note" | "analytics_insight" | "reflection_journal" | "task_checklist";

// Migration mapping from old note types to new note types
const TYPE_MIGRATION_MAP: Record<string, NewNoteType> = {
  // Old type -> New type
  "idea": "idea_bank",
  "ai_insight": "analytics_insight", 
  "conversation": "reflection_journal",
  "brainstorm": "idea_bank",
  "url": "idea_bank",
  "date": "task_checklist",
  "click": "idea_bank"
};

export const migrateNoteTypes = internalMutation({
  handler: async (ctx) => {
    console.log("🚀 Starting note type migration...");
    
    // Get all notes that need migration
    const allNotes = await ctx.db.query("notes").collect();
    let migrationCount = 0;
    
    for (const note of allNotes) {
      const currentType = note.type;
      
      // Check if this note needs migration
      if (currentType && TYPE_MIGRATION_MAP[currentType]) {
        const newType = TYPE_MIGRATION_MAP[currentType];
        
        console.log(`Migrating note ${note._id}: ${currentType} -> ${newType}`);
        
        await ctx.db.patch(note._id, {
          type: newType as any,
          updatedAt: Date.now()
        });
        
        migrationCount++;
      }
    }
    
    console.log(`✅ Migration complete! Updated ${migrationCount} notes.`);
    return { 
      success: true, 
      migratedNotes: migrationCount,
      totalNotes: allNotes.length 
    };
  },
});

export const rollbackNoteTypes = internalMutation({
  handler: async (ctx) => {
    console.log("🔄 Rolling back note type migration...");
    
    // Reverse mapping for rollback
    const ROLLBACK_MAP: Record<NewNoteType, string> = {
      "idea_bank": "idea",
      "analytics_insight": "ai_insight",
      "reflection_journal": "conversation", 
      "task_checklist": "date",
      "content_script": "idea",
      "collaboration_note": "idea"
    };
    
    const allNotes = await ctx.db.query("notes").collect();
    let rollbackCount = 0;
    
    for (const note of allNotes) {
      const currentType = note.type;
      
      if (currentType && ROLLBACK_MAP[currentType as NewNoteType]) {
        const oldType = ROLLBACK_MAP[currentType as NewNoteType];
        
        console.log(`Rolling back note ${note._id}: ${currentType} -> ${oldType}`);
        
        await ctx.db.patch(note._id, {
          type: oldType as any, // Cast to any since we're going back to old schema temporarily
          updatedAt: Date.now()
        });
        
        rollbackCount++;
      }
    }
    
    console.log(`✅ Rollback complete! Updated ${rollbackCount} notes.`);
    return { 
      success: true, 
      rolledBackNotes: rollbackCount,
      totalNotes: allNotes.length 
    };
  },
}); 