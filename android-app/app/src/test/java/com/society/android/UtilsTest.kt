package com.society.android

import com.society.android.utils.Constants
import com.society.android.utils.Formatters
import org.junit.Assert.*
import org.junit.Test

class ConstantsTest {

    @Test
    fun `isAdmin returns true for admin roles`() {
        assertTrue(Constants.isAdmin(Constants.ROLE_MASTER_ADMIN))
        assertTrue(Constants.isAdmin(Constants.ROLE_SOCIETY_ADMIN))
    }

    @Test
    fun `isAdmin returns false for non-admin roles`() {
        assertFalse(Constants.isAdmin(Constants.ROLE_MEMBER))
        assertFalse(Constants.isAdmin(Constants.ROLE_TENANT))
        assertFalse(Constants.isAdmin(Constants.ROLE_VISITOR))
        assertFalse(Constants.isAdmin(null))
    }

    @Test
    fun `canManage returns true for management roles`() {
        assertTrue(Constants.canManage(Constants.ROLE_MASTER_ADMIN))
        assertTrue(Constants.canManage(Constants.ROLE_SOCIETY_ADMIN))
        assertTrue(Constants.canManage(Constants.ROLE_CHAIRMAN))
        assertTrue(Constants.canManage(Constants.ROLE_SECRETARY))
        assertTrue(Constants.canManage(Constants.ROLE_MANAGER))
    }

    @Test
    fun `canManage returns false for regular roles`() {
        assertFalse(Constants.canManage(Constants.ROLE_MEMBER))
        assertFalse(Constants.canManage(Constants.ROLE_TENANT))
        assertFalse(Constants.canManage(Constants.ROLE_VISITOR))
    }

    @Test
    fun `canViewFinance returns true for authorized roles`() {
        assertTrue(Constants.canViewFinance(Constants.ROLE_MASTER_ADMIN))
        assertTrue(Constants.canViewFinance(Constants.ROLE_TREASURER))
        assertTrue(Constants.canViewFinance(Constants.ROLE_CHAIRMAN))
    }

    @Test
    fun `canViewFinance returns false for non-finance roles`() {
        assertFalse(Constants.canViewFinance(Constants.ROLE_MEMBER))
        assertFalse(Constants.canViewFinance(Constants.ROLE_VISITOR))
    }

    @Test
    fun `canCreateNotice returns true for authorized roles`() {
        assertTrue(Constants.canCreateNotice(Constants.ROLE_MASTER_ADMIN))
        assertTrue(Constants.canCreateNotice(Constants.ROLE_SECRETARY))
        assertTrue(Constants.canCreateNotice(Constants.ROLE_COMMITTEE_MEMBER))
    }

    @Test
    fun `canCreateNotice returns false for regular members`() {
        assertFalse(Constants.canCreateNotice(Constants.ROLE_MEMBER))
        assertFalse(Constants.canCreateNotice(Constants.ROLE_TENANT))
    }

    @Test
    fun `canImportData returns true only for admin roles`() {
        assertTrue(Constants.canImportData(Constants.ROLE_MASTER_ADMIN))
        assertTrue(Constants.canImportData(Constants.ROLE_SOCIETY_ADMIN))
        assertFalse(Constants.canImportData(Constants.ROLE_CHAIRMAN))
        assertFalse(Constants.canImportData(Constants.ROLE_MEMBER))
    }
}

class FormattersTest {

    @Test
    fun `formatCurrency formats correctly`() {
        val result = Formatters.formatCurrency(1500.0)
        assertTrue(result.contains("1,500"))
    }

    @Test
    fun `formatCurrency handles null`() {
        assertEquals("--", Formatters.formatCurrency(null))
    }

    @Test
    fun `formatCurrency handles zero`() {
        val result = Formatters.formatCurrency(0.0)
        assertTrue(result.contains("0"))
    }

    @Test
    fun `formatDate handles null`() {
        assertEquals("--", Formatters.formatDate(null))
    }

    @Test
    fun `formatDateTime handles null`() {
        assertEquals("--", Formatters.formatDateTime(null))
    }

    @Test
    fun `formatStatus capitalizes correctly`() {
        assertEquals("Pending", Formatters.formatStatus("PENDING"))
        assertEquals("In Progress", Formatters.formatStatus("IN_PROGRESS"))
        assertEquals("--", Formatters.formatStatus(null))
    }
}
