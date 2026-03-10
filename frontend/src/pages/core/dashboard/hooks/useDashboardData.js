import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  complaintApi,
  contractApi,
  flatApi,
  maintenanceBillApi,
  noticeApi,
  reportApi,
  societyApi,
  tenantApi,
  ticketApi,
  userApi,
  vehicleApi,
} from "../../../../../../api";
import { useAuth } from "../../../../context/AuthContext";
import useMinLoadingTime from "../../../../hooks/useMinLoadingTime";
import { DEFAULT_ROLE_UI, ROLE_UI } from "../config/dashboardRoles";
import useWeather from "./useWeather";

export default function useDashboardData() {
  const [searchParams] = useSearchParams();
  const { user, hasRole, isCommitteeLevel, canViewFinancials, canManageTenants } = useAuth();
  const navigate = useNavigate();

  const isPlatformOwner = hasRole("MASTER_ADMIN");
  const societyIdFromUrl = searchParams.get("society");
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl);
  const scopedSocietyId = Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0 ? parsedSocietyIdFromUrl : null;
  const isScopedSocietyMode = isPlatformOwner && !!scopedSocietyId;

  const role = isScopedSocietyMode ? "SOCIETY_ADMIN" : user?.role;
  const isPlatformLevel = isPlatformOwner && !isScopedSocietyMode;
  const dashboardSocietyId = isScopedSocietyMode ? scopedSocietyId : user?.societyId;
  const isMemberOrTenant = user?.role === "MEMBER" || user?.role === "TENANT";
  const isSocietyOpsLevel = !isPlatformLevel && !isMemberOrTenant;
  const isManagerRole = role === "MANAGER";
  const isEmployeeRole = role === "EMPLOYEE";
  const canSeeFinanceSection = canViewFinancials();
  const canSeeContractAlerts = hasRole("SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE", "MANAGER");
  const roleUi = ROLE_UI[role] || DEFAULT_ROLE_UI;

  const { data: societies = [], isLoading: societiesLoading, isError: societiesError } = useQuery({
    queryKey: ["societies"],
    queryFn: () => societyApi.getAll().then((res) => res.data),
    enabled: isPlatformLevel,
  });

  const { data: platformUsers = [] } = useQuery({
    queryKey: ["dashboard-platform-users"],
    queryFn: () => userApi.getAll().then((res) => res.data).catch(() => []),
    enabled: isPlatformLevel,
    placeholderData: [],
  });

  const { data: flats = [] } = useQuery({
    queryKey: ["flats", dashboardSocietyId, user?.id],
    queryFn: () => dashboardSocietyId ? flatApi.getBySociety(dashboardSocietyId).then((res) => res.data).catch(() => []) : flatApi.getAll(user?.id).then((res) => res.data).catch(() => []),
    enabled: isSocietyOpsLevel && (!!dashboardSocietyId || !!user?.id),
    placeholderData: [],
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants", dashboardSocietyId],
    queryFn: () => dashboardSocietyId ? tenantApi.getBySociety(dashboardSocietyId).then((res) => res.data).catch(() => []) : tenantApi.getAll().then((res) => res.data).catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", dashboardSocietyId],
    queryFn: () => dashboardSocietyId ? vehicleApi.getBySociety(dashboardSocietyId).then((res) => res.data).catch(() => []) : vehicleApi.getAll().then((res) => res.data).catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", dashboardSocietyId],
    queryFn: () => dashboardSocietyId ? contractApi.getBySociety(dashboardSocietyId).then((res) => res.data).catch(() => []) : contractApi.getAll().then((res) => res.data).catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ["tickets", dashboardSocietyId],
    queryFn: () => dashboardSocietyId ? ticketApi.getBySociety(dashboardSocietyId).then((res) => res.data).catch(() => []) : ticketApi.getAll().then((res) => res.data).catch(() => []),
    placeholderData: [],
  });

  const { data: maintenanceBills = [] } = useQuery({
    queryKey: ["maintenance-bills", dashboardSocietyId, user?.id],
    queryFn: () => dashboardSocietyId ? maintenanceBillApi.getBySociety(dashboardSocietyId).then((res) => res.data).catch(() => []) : maintenanceBillApi.getAll().then((res) => res.data).catch(() => []),
    enabled: !!user?.id,
    placeholderData: [],
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints", dashboardSocietyId, user?.id],
    queryFn: () => dashboardSocietyId && user?.id ? complaintApi.getBySociety(dashboardSocietyId, user.id).then((res) => res.data).catch(() => []) : complaintApi.getAll(user?.id).then((res) => res.data).catch(() => []),
    enabled: !!user?.id,
    placeholderData: [],
  });

  const { data: dashboardReport } = useQuery({
    queryKey: ["dashboardReport", dashboardSocietyId],
    queryFn: () => dashboardSocietyId && isCommitteeLevel() ? reportApi.getDashboard(dashboardSocietyId).then((res) => res.data) : null,
    enabled: !!dashboardSocietyId && isCommitteeLevel(),
  });

  const { data: notices = [] } = useQuery({
    queryKey: ["notices", dashboardSocietyId],
    queryFn: () => dashboardSocietyId ? noticeApi.getBySociety(dashboardSocietyId).then((res) => res.data).catch(() => []) : [],
    enabled: !!dashboardSocietyId,
  });

  const securityLogs = [];
  const { data: weather, locationName } = useWeather();
  const showSkeleton = useMinLoadingTime(societiesLoading || societiesError);

  return {
    user, navigate, role, roleUi, isPlatformOwner, isPlatformLevel, isMemberOrTenant, isSocietyOpsLevel,
    isManagerRole, isEmployeeRole, canSeeFinanceSection, canSeeContractAlerts, canViewFinancials,
    canManageTenants, isCommitteeLevel, dashboardSocietyId, scopedSocietyId, showSkeleton,
    weather, locationName, societies, platformUsers, flats, tenants, vehicles, contracts,
    allTickets, maintenanceBills, complaints, dashboardReport, notices, securityLogs,
  };
}


