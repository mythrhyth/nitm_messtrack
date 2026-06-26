-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LeaveRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rollNo" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "hostel" TEXT NOT NULL,
    "leaveStart" TEXT NOT NULL,
    "leaveEnd" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "breakfastMissed" INTEGER NOT NULL,
    "lunchMissed" INTEGER NOT NULL,
    "dinnerMissed" INTEGER NOT NULL,
    "refundAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "semester" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveRecord_rollNo_fkey" FOREIGN KEY ("rollNo") REFERENCES "Student" ("rollNo") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LeaveRecord" ("breakfastMissed", "createdAt", "dinnerMissed", "hostel", "id", "leaveEnd", "leaveStart", "lunchMissed", "reason", "refundAmount", "rollNo", "semester", "studentName", "updatedAt") SELECT "breakfastMissed", "createdAt", "dinnerMissed", "hostel", "id", "leaveEnd", "leaveStart", "lunchMissed", "reason", "refundAmount", "rollNo", "semester", "studentName", "updatedAt" FROM "LeaveRecord";
DROP TABLE "LeaveRecord";
ALTER TABLE "new_LeaveRecord" RENAME TO "LeaveRecord";
CREATE TABLE "new_Student" (
    "rollNo" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "hostel" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "messFee" REAL NOT NULL,
    "amountPaid" REAL NOT NULL,
    "refundEarned" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TEXT NOT NULL DEFAULT '2003-06-15',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Student" ("amountPaid", "createdAt", "dept", "email", "gender", "hostel", "messFee", "name", "phone", "refundEarned", "rollNo", "room", "semester", "status", "updatedAt", "year") SELECT "amountPaid", "createdAt", "dept", "email", "gender", "hostel", "messFee", "name", "phone", "refundEarned", "rollNo", "room", "semester", "status", "updatedAt", "year" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
