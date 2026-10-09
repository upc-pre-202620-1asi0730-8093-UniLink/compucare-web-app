<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const message = ref('')

function handleLogin() {
  message.value =
      'El inicio de sesión estará disponible próximamente.'
}
</script>

<template>
  <main class="login-page">
    <div class="bg-shape bg-shape-1"></div>
    <div class="bg-shape bg-shape-2"></div>
    <div class="bg-shape bg-shape-3"></div>
    <div class="bg-shape bg-shape-4"></div>

    <div class="bg-ring bg-ring-1"></div>
    <div class="bg-ring bg-ring-2"></div>

    <div class="bg-bar bg-bar-1"></div>
    <div class="bg-bar bg-bar-2"></div>
    <div class="bg-bar bg-bar-3"></div>

    <div class="bg-dots bg-dots-1"></div>
    <div class="bg-dots bg-dots-2"></div>

    <section class="login-card">
      <div class="brand-panel">
        <div class="brand-name">
          CompuCare<span>.</span>
        </div>

        <div class="brand-content">
          <h1>Tu tecnología, en buenas manos.</h1>
          <p>
            Gestiona el mantenimiento y soporte técnico
            de los equipos de tu empresa desde un solo lugar.
          </p>
        </div>

        <p class="brand-footer">Powered by UniLink</p>
      </div>

      <div class="form-panel">
        <div class="form-decoration form-decoration-one"></div>
        <div class="form-decoration form-decoration-two"></div>
        <div class="form-decoration form-decoration-three"></div>
        <div class="form-grid"></div>

        <div class="form-content">
          <h2>Bienvenido de nuevo</h2>

          <p class="subtitle">
            Ingresa tus credenciales para acceder a CompuCare.
          </p>

          <form @submit.prevent="handleLogin">
            <div class="field">
              <label for="email">Correo electrónico</label>
              <input
                  id="email"
                  v-model.trim="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  autocomplete="username"
                  required
              />
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <input
                  id="password"
                  v-model="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                  required
              />
            </div>

            <button type="submit" class="login-button">
              Iniciar sesión
            </button>

            <p v-if="message" class="notice" role="status">
              {{ message }}
            </p>
          </form>

          <p class="help-text">
            ¿Necesitas ayuda para acceder?
            Contacta al administrador de tu empresa.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  overflow: hidden;
  font-family: Arial, Helvetica, sans-serif;
  background:
      radial-gradient(circle at top left, #dff6ee 0%, transparent 28%),
      radial-gradient(circle at bottom right, #d8f0ec 0%, transparent 26%),
      linear-gradient(135deg, #edf5f3 0%, #f6f8f7 45%, #eaf3f1 100%);
}

/* DECORACIONES EXTERNAS GRANDES */

.bg-shape,
.bg-ring,
.bg-bar,
.bg-dots {
  position: absolute;
  pointer-events: none;
}

.bg-shape {
  border-radius: 50%;
  z-index: 0;
}

.bg-shape-1 {
  width: 380px;
  height: 380px;
  top: -120px;
  left: -110px;
  background: rgba(8, 127, 117, 0.22);
  filter: blur(8px);
}

.bg-shape-2 {
  width: 280px;
  height: 280px;
  top: 70px;
  right: -70px;
  background: rgba(17, 45, 53, 0.16);
  filter: blur(4px);
}

.bg-shape-3 {
  width: 320px;
  height: 320px;
  bottom: -110px;
  left: -80px;
  background: rgba(199, 241, 200, 0.95);
  filter: blur(6px);
}

.bg-shape-4 {
  width: 340px;
  height: 340px;
  bottom: -120px;
  right: -80px;
  background: rgba(8, 127, 117, 0.16);
  filter: blur(8px);
}

.bg-ring {
  border-radius: 50%;
  border: 3px solid rgba(8, 127, 117, 0.28);
  z-index: 0;
}

.bg-ring-1 {
  width: 460px;
  height: 460px;
  left: -170px;
  top: 110px;
}

.bg-ring-2 {
  width: 400px;
  height: 400px;
  right: -150px;
  bottom: 50px;
  border-color: rgba(17, 45, 53, 0.22);
}

.bg-bar {
  height: 18px;
  border-radius: 999px;
  transform: rotate(-28deg);
  z-index: 0;
  opacity: 0.9;
}

.bg-bar-1 {
  width: 220px;
  background: rgba(8, 127, 117, 0.32);
  top: 120px;
  left: 130px;
}

.bg-bar-2 {
  width: 180px;
  background: rgba(17, 45, 53, 0.22);
  bottom: 130px;
  right: 150px;
}

.bg-bar-3 {
  width: 140px;
  background: rgba(199, 241, 200, 1);
  top: 220px;
  right: 210px;
}

.bg-dots {
  width: 150px;
  height: 150px;
  background-image: radial-gradient(rgba(8, 127, 117, 0.36) 2px, transparent 2px);
  background-size: 18px 18px;
  opacity: 0.95;
  z-index: 0;
}

.bg-dots-1 {
  left: 85px;
  bottom: 90px;
}

.bg-dots-2 {
  right: 90px;
  top: 100px;
}

/* TARJETA */

.login-card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1000px;
  min-height: 570px;
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 55px rgba(17, 45, 53, 0.16);
}

.brand-panel {
  background: linear-gradient(160deg, #112d35 0%, #0d3841 100%);
  color: #ffffff;
  padding: 45px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand-name {
  font-size: 28px;
  font-weight: 800;
}

.brand-name span {
  color: #c7f1c8;
}

.brand-content h1 {
  font-size: 38px;
  line-height: 1.2;
  margin-bottom: 22px;
}

.brand-content p {
  color: #c7f1c8;
  line-height: 1.7;
}

.brand-footer {
  font-size: 13px;
  opacity: 0.7;
}

/* PANEL DERECHO */

.form-panel {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 55px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfc 100%);
  overflow: hidden;
}

.form-decoration {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.form-decoration-one {
  width: 180px;
  height: 180px;
  background: rgba(8, 127, 117, 0.08);
  top: -45px;
  right: -45px;
}

.form-decoration-two {
  width: 120px;
  height: 120px;
  background: rgba(17, 45, 53, 0.06);
  bottom: 30px;
  right: 35px;
}

.form-decoration-three {
  width: 90px;
  height: 90px;
  background: rgba(199, 241, 200, 0.7);
  top: 95px;
  right: 80px;
}

.form-grid {
  position: absolute;
  left: 38px;
  bottom: 42px;
  width: 88px;
  height: 88px;
  background-image: radial-gradient(rgba(8, 127, 117, 0.18) 1.4px, transparent 1.4px);
  background-size: 14px 14px;
  pointer-events: none;
}

.form-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 350px;
}

.form-content h2 {
  color: #112d35;
  font-size: 29px;
  margin-bottom: 12px;
}

.subtitle {
  color: #66777a;
  line-height: 1.6;
  margin-bottom: 35px;
}

.field {
  margin-bottom: 22px;
}

.field label {
  display: block;
  color: #112d35;
  font-weight: 600;
  margin-bottom: 9px;
}

.field input {
  box-sizing: border-box;
  width: 100%;
  padding: 14px;
  border: 1px solid #d5dfdd;
  border-radius: 8px;
  font-size: 15px;
  background: #ffffff;
}

.field input:focus {
  outline: none;
  border-color: #087f75;
  box-shadow: 0 0 0 3px rgba(8, 127, 117, 0.15);
}

.login-button {
  width: 100%;
  padding: 15px;
  background: #087f75;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.login-button:hover {
  background: #066b63;
}

.notice {
  margin-top: 16px;
  color: #087f75;
  font-size: 14px;
}

.help-text {
  margin-top: 30px;
  color: #66777a;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 1100px) {
  .bg-bar-1,
  .bg-bar-2,
  .bg-bar-3,
  .bg-dots-1,
  .bg-dots-2 {
    opacity: 0.65;
  }
}

@media (max-width: 700px) {
  .login-card {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 210px;
    padding: 30px;
    gap: 25px;
  }

  .brand-content h1 {
    font-size: 27px;
  }

  .form-panel {
    padding: 35px 25px;
  }

  .form-decoration-one {
    width: 120px;
    height: 120px;
    top: -25px;
    right: -25px;
  }

  .form-decoration-two {
    width: 85px;
    height: 85px;
    bottom: 20px;
    right: 20px;
  }

  .form-decoration-three {
    width: 65px;
    height: 65px;
    top: 80px;
    right: 40px;
  }

  .form-grid {
    width: 60px;
    height: 60px;
    left: 20px;
    bottom: 20px;
  }

  .bg-ring,
  .bg-bar,
  .bg-dots {
    display: none;
  }

  .bg-shape-1,
  .bg-shape-2,
  .bg-shape-3,
  .bg-shape-4 {
    transform: scale(0.75);
  }
}
</style>