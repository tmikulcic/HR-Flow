import { createRouter, createWebHistory } from 'vue-router';
import AdministrationPage from '../pages/AdministrationPage.vue';
import ApprovalsPage from '../pages/ApprovalsPage.vue';
import AppLayout from '../layouts/AppLayout.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import EmployeeDetailPage from '../pages/EmployeeDetailPage.vue';
import EmployeesPage from '../pages/EmployeesPage.vue';
import LeaveRequestsPage from '../pages/LeaveRequestsPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import NewLeaveRequestPage from '../pages/NewLeaveRequestPage.vue';
import NotFoundPage from '../pages/NotFoundPage.vue';
import NotificationsPage from '../pages/NotificationsPage.vue';
import TeamPage from '../pages/TeamPage.vue';
import TimeTrackingPage from '../pages/TimeTrackingPage.vue';
import UiPreviewPage from '../pages/UiPreviewPage.vue';
import {
  canAccessEmployee,
  hasPermission,
  PERMISSIONS,
} from '../domain/index.js';
import { employeeRepository } from '../repositories/index.js';
import { useSessionStore } from '../stores/sessionStore.js';

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardPage,
        meta: {
          title: 'Dashboard',
          permission: PERMISSIONS.VIEW_DASHBOARD,
        },
      },
      {
        path: 'employees',
        name: 'employees',
        component: EmployeesPage,
        meta: {
          title: 'Employees',
          permission: PERMISSIONS.VIEW_EMPLOYEES,
        },
      },
      {
        path: 'employees/:employeeId',
        name: 'employee-detail',
        component: EmployeeDetailPage,
        meta: {
          title: 'Employee profile',
          permission: PERMISSIONS.VIEW_EMPLOYEE_DETAILS,
        },
      },
      {
        path: 'time-tracking',
        name: 'time-tracking',
        component: TimeTrackingPage,
        meta: {
          title: 'Time tracking',
          permission: PERMISSIONS.TRACK_TIME,
        },
      },
      {
        path: 'leave-requests',
        name: 'leave-requests',
        component: LeaveRequestsPage,
        meta: {
          title: 'My leave',
          permission: PERMISSIONS.MANAGE_OWN_LEAVE,
        },
      },
      {
        path: 'leave-requests/new',
        name: 'new-leave-request',
        component: NewLeaveRequestPage,
        meta: {
          title: 'New leave request',
          permission: PERMISSIONS.MANAGE_OWN_LEAVE,
        },
      },
      {
        path: 'team',
        name: 'team',
        component: TeamPage,
        meta: {
          title: 'My team',
          permission: PERMISSIONS.VIEW_TEAM,
        },
      },
      {
        path: 'approvals',
        name: 'approvals',
        component: ApprovalsPage,
        meta: {
          title: 'Approvals',
          permission: PERMISSIONS.REVIEW_LEAVE_REQUESTS,
        },
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: NotificationsPage,
        meta: {
          title: 'Notifications',
          permission: PERMISSIONS.VIEW_NOTIFICATIONS,
        },
      },
      {
        path: 'administration',
        name: 'administration',
        component: AdministrationPage,
        meta: {
          title: 'Administration',
          permission: PERMISSIONS.MANAGE_ADMINISTRATION,
        },
      },
    ],
  },
  { path: '/ui-preview', name: 'ui-preview', component: UiPreviewPage },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const session = useSessionStore();

  if (!session.isInitialized.value) {
    await session.initializeSession();
  }

  if (to.meta.guestOnly && session.isAuthenticated.value) {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresAuth && !session.isAuthenticated.value) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }

  if (
    to.meta.permission &&
    !hasPermission(session.currentRole.value, to.meta.permission)
  ) {
    return { name: 'dashboard' };
  }

  if (to.name === 'employee-detail') {
    const targetEmployee = employeeRepository.getById(to.params.employeeId);

    if (
      !canAccessEmployee(
        session.currentUser.value,
        session.currentEmployee.value,
        targetEmployee,
      )
    ) {
      return { name: 'dashboard' };
    }
  }

  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · HR-Flow` : 'HR-Flow';
});

export default router;
