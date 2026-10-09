
<script setup>
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import useIamStore from './iam/application/iam.store.js'

const route = useRoute()
const router = useRouter()
const iamStore = useIamStore()

const menuOpen = ref(false)

const showSidebar = computed(() =>
    iamStore.isAuthenticated && route.meta.public !== true
)

const userName = computed(() =>
    iamStore.user?.name || 'Usuario CompuCare'
)

const userRole = computed(() => iamStore.role)

const roleLabels = {
  employee: 'Empleado',
  technician: 'Técnico',
  admin: 'Responsable de empresa',
  sysadmin: 'Administrador UniLink',
  company_manager: 'Responsable de empresa'
}

const roleLabel = computed(() =>
    roleLabels[userRole.value] || 'Usuario'
)

const menuItems = computed(() => {
  const items = []

  if (userRole.value === 'employee') {
    items.push({
      label: 'Mis solicitudes',
      icon: 'pi pi-ticket',
      path: '/my-tickets'
    })
  }

  if (userRole.value === 'technician') {
    items.push({
      label: 'Mis asignaciones',
      icon: 'pi pi-wrench',
      path: '/technician'
    })
  }

  if (userRole.value === 'sysadmin') {
    items.push({
      label: 'Gestión de tickets',
      icon: 'pi pi-clipboard',
      path: '/admin/tickets'
    })
  }

  if (
      userRole.value === 'admin' ||
      userRole.value === 'company_manager'
  ) {
    items.push({
      label: 'Empleados',
      icon: 'pi pi-users',
      path: '/employees'
    })
  }

  items.push({
    label: 'Mi perfil',
    icon: 'pi pi-user',
    path: '/profile'
  })

  return items
})

function navigate(path) {
  menuOpen.value = false
  router.push(path)
}

function logout() {
  iamStore.signOut()
  menuOpen.value = false
  router.replace('/login')
}
</script>

<template>
  <div
      class="app-shell"
      :class="{ 'app-shell-private': showSidebar }"
  >
    <template v-if="showSidebar">
      <button
          class="mobile-menu-button"
          type="button"
          aria-label="Abrir menú de navegación"
          @click="menuOpen = true"
      >
        <i class="pi pi-bars"></i>
      </button>

      <div
          v-if="menuOpen"
          class="sidebar-overlay"
          @click="menuOpen = false"
      ></div>

      <aside
          class="sidebar"
          :class="{ 'sidebar-open': menuOpen }"
      >
        <div class="sidebar-top">
          <div class="sidebar-brand">
            <div class="brand-mark">
              <i class="pi pi-desktop"></i>
            </div>

            <div>
              <div class="brand-title">
                CompuCare<span>.</span>
              </div>
              <div class="brand-subtitle">
                Powered by UniLink
              </div>
            </div>
          </div>

          <button
              class="sidebar-close"
              type="button"
              aria-label="Cerrar menú"
              @click="menuOpen = false"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="sidebar-divider"></div>

        <nav class="sidebar-navigation" aria-label="Navegación principal">
          <div class="navigation-heading">
            MENÚ PRINCIPAL
          </div>

          <button
              v-for="item in menuItems"
              :key="item.path"
              type="button"
              class="navigation-button"
              :class="{
              'navigation-active': route.path === item.path
            }"
              @click="navigate(item.path)"
          >
            <i :class="item.icon"></i>
            <span>{{ item.label }}</span>
            <i class="pi pi-angle-right navigation-arrow"></i>
          </button>
        </nav>

        <div class="sidebar-bottom">
          <div class="user-card">
            <div class="user-avatar">
              {{ userName.charAt(0).toUpperCase() }}
            </div>

            <div class="user-information">
              <strong>{{ userName }}</strong>
              <span>{{ roleLabel }}</span>
            </div>
          </div>

          <button
              class="logout-button"
              type="button"
              @click="logout"
          >
            <i class="pi pi-sign-out"></i>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </template>

    <div class="app-content">
      <RouterView />
    </div>

    <pv-toast />
    <pv-confirm-dialog />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
}

.app-shell-private {
  display: flex;
  background: #f6f8f7;
}

.app-content {
  min-width: 0;
  width: 100%;
  flex: 1;
}

.sidebar {
  width: 268px;
  min-width: 268px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
      165deg,
      #112d35 0%,
      #153a43 65%,
      #0c2931 100%
  );
  color: #ffffff;
  padding: 28px 17px 20px;
  box-sizing: border-box;
  z-index: 100;
}

.sidebar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 6px 8px;
}

.brand-mark {
  width: 39px;
  height: 39px;
  background: rgba(199, 241, 200, 0.15);
  border: 1px solid rgba(199, 241, 200, 0.22);
  color: #c7f1c8;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-size: 18px;
}

.brand-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.brand-title span {
  color: #c7f1c8;
}

.brand-subtitle {
  font-size: 10px;
  color: #9fb9b7;
  margin-top: 4px;
}

.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 27px 8px 30px;
}

.sidebar-navigation {
  flex: 1;
}

.navigation-heading {
  color: #93aaa9;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
  padding: 0 14px;
  margin-bottom: 16px;
}

.navigation-button {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 12px 13px;
  border: 0;
  border-radius: 9px;
  color: #b9cbca;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  margin-bottom: 6px;
  transition: background 0.2s ease, color 0.2s ease;
}

.navigation-button > i:first-child {
  font-size: 17px;
  width: 21px;
  text-align: center;
}

.navigation-button > span {
  flex: 1;
}

.navigation-button:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.09);
}

.navigation-active {
  color: #ffffff;
  background: #087f75;
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.12);
}

.navigation-active:hover {
  background: #087f75;
}

.navigation-arrow {
  font-size: 11px;
  opacity: 0.65;
}

.sidebar-bottom {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 7px 20px;
}

.user-avatar {
  width: 39px;
  height: 39px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: #c7f1c8;
  color: #112d35;
  font-weight: 800;
  font-size: 16px;
}

.user-information {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
}

.user-information strong {
  color: #ffffff;
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.user-information span {
  color: #a9c2bf;
  font-size: 11px;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 9px;
  color: #d5e3e1;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  transition: background 0.2s ease;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.14);
}

.mobile-menu-button,
.sidebar-close,
.sidebar-overlay {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    width: 230px;
    min-width: 230px;
  }
}

@media (max-width: 700px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 268px;
    min-width: 268px;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(10, 32, 38, 0.55);
    z-index: 90;
  }

  .mobile-menu-button {
    display: grid;
    place-items: center;
    position: fixed;
    top: 15px;
    left: 15px;
    width: 43px;
    height: 43px;
    border: none;
    border-radius: 10px;
    background: #112d35;
    color: white;
    z-index: 80;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(17, 45, 53, 0.16);
  }

  .sidebar-close {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    cursor: pointer;
  }

  .app-content {
    padding-top: 42px;
  }
}
</style>
