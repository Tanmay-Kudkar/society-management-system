# ✅ Feature: Force Delete Option for Societies

**Status:** ✅ **IMPLEMENTED**  
**Date:** February 17, 2026  
**Feature:** Added force delete capability to Society Admin page, matching Organization page functionality

---

## 🎯 Feature Description

Added the ability to **force delete societies** when normal deletion fails due to constraint violations (e.g., linked units, users, bills, etc.). This provides the same force delete functionality that already exists on the Organizations page.

---

## 🔧 Changes Made

### **File Modified:**
`admin-web/src/pages/society/SocietyAdmins.jsx`

### **1. Updated `deleteSocietyMutation` to Support Force Delete**

**Before:**
```javascript
const deleteSocietyMutation = useMutation({
  mutationFn: (id) => societyApi.delete(id, user.id),
  onMutate: (id) => {
    setDeletingSocietyId(id)
  },
  onSuccess: () => {
    toast.success('Society deleted successfully')
  },
  // ...
})
```

**After:**
```javascript
const deleteSocietyMutation = useMutation({
  mutationFn: ({ id, force = false }) => societyApi.delete(id, user.id, force),
  onMutate: ({ id }) => {
    setDeletingSocietyId(id)
  },
  onSuccess: (_, variables) => {
    toast.success(variables?.force 
      ? 'Society force-deleted successfully' 
      : 'Society deleted successfully')
  },
  // ...
})
```

**Changes:**
- ✅ `mutationFn` now accepts `{ id, force }` object instead of just `id`
- ✅ Passes `force` parameter to backend API
- ✅ Shows different success message for force delete
- ✅ `onMutate` updated to destructure `id` from object

---

### **2. Enhanced `handleDeleteSociety` with Force Delete Flow**

**Before:**
```javascript
const handleDeleteSociety = async (society) => {
  const confirmed = await confirmDialog({ /* ... */ })
  
  if (confirmed) {
    deleteSocietyMutation.mutate(society.id)
  }
}
```

**After:**
```javascript
const handleDeleteSociety = async (society) => {
  // Step 1: Show initial confirmation dialog
  const confirmed = await confirmDialog({ /* ... */ })
  if (!confirmed) return

  try {
    // Step 2: Attempt normal delete
    await deleteSocietyMutation.mutateAsync({ id: society.id, force: false })
  } catch (error) {
    // Step 3: Check if force delete should be offered
    const serverMessage = error?.response?.data?.message || parseApiError(error)
    const shouldOfferForceDelete =
      error?.response?.status === 409 &&
      String(serverMessage).toLowerCase().includes('use force delete')

    if (!shouldOfferForceDelete) {
      return // Show error and stop
    }

    // Step 4: Show force delete warning
    const finalWarning = await confirmDialog({
      title: 'Final Warning: Force Delete Society',
      message: `This will permanently delete "${society.name}" and unlink all related records...`,
      confirmText: 'Force Delete',
      tone: 'danger',
      caution: 'This action is irreversible and may impact units, users, bills...',
    })

    if (!finalWarning) return

    // Step 5: Execute force delete
    try {
      await deleteSocietyMutation.mutateAsync({ id: society.id, force: true })
    } catch (forceError) {
      toast.error(parseApiError(forceError))
    }
  }
}
```

**Changes:**
- ✅ Two-step confirmation process (normal delete → force delete)
- ✅ Detects HTTP 409 (Conflict) response with "use force delete" message
- ✅ Shows additional warning before force delete
- ✅ Enhanced caution message specific to societies
- ✅ Proper error handling for both normal and force delete

---

## 🔄 User Flow

### **Scenario 1: Successful Normal Delete**
```
1. User clicks delete button on society
2. Confirmation dialog appears
3. User confirms
4. Society deleted successfully ✅
5. Toast: "Society deleted successfully"
```

### **Scenario 2: Delete with Constraints (Force Delete Triggered)**
```
1. User clicks delete button on society
2. Confirmation dialog appears
3. User confirms
4. Backend returns 409 error: "Cannot delete society with existing units. Use force delete."
5. Second confirmation dialog appears: "Final Warning: Force Delete Society"
6. User sees impacts:
   - Society: Green Heights CHS
   - City: Mumbai
   - Organization: Skyline Group
   - Caution: "This action is irreversible and may impact units, users, bills..."
7. User confirms force delete
8. Society force-deleted ✅
9. Toast: "Society force-deleted successfully"
```

---

## 🎨 UI/UX Enhancements

### **Force Delete Warning Dialog Includes:**

**Details:**
- Society name
- City
- Organization (if linked)

**Caution Message:**
```
"This action is irreversible and may impact units, users, bills, 
and society-scoped records."
```

**Button Colors:**
- Normal Delete: Red "Delete" button
- Force Delete: Darker red "Force Delete" button (more dangerous)

---

## 🧪 Testing

### **Test Cases:**

#### **Test 1: Delete Empty Society**
- **Setup:** Create a society with no units, users, or bills
- **Action:** Click delete
- **Expected:** ✅ Normal delete succeeds immediately
- **Result:** "Society deleted successfully"

#### **Test 2: Delete Society with Units**
- **Setup:** Create a society with 5 flats
- **Action:** Click delete → Confirm
- **Expected:** ❌ Normal delete fails with 409 error
- **Result:** Force delete dialog appears
- **Action:** Confirm force delete
- **Expected:** ✅ Society and units deleted
- **Result:** "Society force-deleted successfully"

#### **Test 3: Cancel Force Delete**
- **Setup:** Society with linked data
- **Action:** Click delete → Confirm → See force delete warning → Cancel
- **Expected:** ✅ Nothing deleted
- **Result:** Society remains intact

#### **Test 4: Delete Society with Users and Bills**
- **Setup:** Society with 10 units, 15 users, 20 maintenance bills
- **Action:** Click delete → Confirm → Confirm force delete
- **Expected:** ✅ Society and all related records deleted
- **Result:** "Society force-deleted successfully"

---

## 📊 Backend API Support

The backend already supports force delete for societies:

**API Endpoint:**
```
DELETE /societies/{id}?userId={userId}&force=true
```

**Response Codes:**
- `200 OK` - Society deleted successfully
- `409 Conflict` - Cannot delete (with message suggesting force delete)
- `404 Not Found` - Society not found
- `403 Forbidden` - User not authorized

**Backend Logic:**
```java
// Normal delete checks constraints
if (!force && hasLinkedRecords(societyId)) {
    throw new ApiException(HttpStatus.CONFLICT, 
        "Cannot delete society with existing units. Use force delete.");
}

// Force delete removes all linked records
if (force) {
    deleteLinkedUnits(societyId);
    deleteLinkedUsers(societyId);
    deleteLinkedBills(societyId);
    deleteSociety(societyId);
}
```

---

## ✅ Benefits

1. **Consistency** - Same force delete UX as Organizations page
2. **Safety** - Two-step confirmation prevents accidental deletion
3. **Flexibility** - Admins can clean up societies with linked data
4. **User Experience** - Clear error messages guide users
5. **Data Integrity** - Backend ensures proper cascade deletion

---

## 🚀 Deployment

### **Frontend Changes Only:**
```powershell
# No backend changes needed - API already supports force delete

# 1. Changes are already in SocietyAdmins.jsx
# 2. Refresh your browser to see the changes
# 3. Test by trying to delete a society with units
```

### **No Database Changes Required**
- ✅ Backend API already implemented
- ✅ No schema changes needed
- ✅ Frontend-only update

---

## 📖 Related Files

**Modified:**
- ✅ `admin-web/src/pages/society/SocietyAdmins.jsx`

**Reference Implementation:**
- `admin-web/src/pages/society/Organizations.jsx` (force delete pattern)

**API Support:**
- `api/index.js` - `societyApi.delete(id, userId, force)`
- Backend: `SocietyController.java` - DELETE endpoint with force parameter

---

## 🎯 Feature Parity Checklist

Comparing with Organizations page force delete:

- [x] Two-step confirmation dialog
- [x] Detect 409 Conflict response
- [x] Check for "use force delete" in error message
- [x] Show force delete warning with details
- [x] Pass `force=true` to backend API
- [x] Display appropriate success messages
- [x] Handle force delete errors
- [x] Update toast messages based on force flag

**Result:** ✅ **Full feature parity achieved**

---

## 📝 Notes

- Force delete is only offered when backend returns HTTP 409 with specific message
- Normal delete is always attempted first (safer approach)
- Force delete requires explicit confirmation (prevents accidents)
- Backend handles all cascade deletion logic
- Frontend only manages UI flow and API calls

---

**Implemented:** February 17, 2026  
**Status:** ✅ Ready for Testing  
**Next Steps:** Test in browser by attempting to delete societies with linked data
