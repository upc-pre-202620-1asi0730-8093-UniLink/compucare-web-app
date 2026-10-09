<script setup>
import {ref} from "vue";
import {useRouter} from "vue-router";
import useIamStore from "../../application/iam.store.js";
import {useFeedback} from "../../../shared/presentation/use-feedback.js";

const router = useRouter();
const iam = useIamStore();
const {ok, fail} = useFeedback();
const email = ref('');
const sentToken = ref(null);   // En desarrollo mostramos el token que iría por correo
const newPassword = ref('');

async function sendLink() {
  try {
    const data = await iam.forgotPassword(email.value);
    sentToken.value = data.devToken;
    ok('Enlace enviado. El token es válido por 24 horas.');
  } catch (e) {
    fail(e);   // "No se encontró la cuenta"
  }
}

async function reset() {
  try {
    await iam.resetPassword(sentToken.value, newPassword.value);
    ok('Contraseña actualizada');
    router.push('/login');
  } catch (e) {
    fail(e);
  }
}
</script>

<template>
  <div class="p-4 flex justify-content-center">
    <pv-card class="w-full md:w-25rem">
      <template #title>Recuperar contraseña</template>
      <template #content>
        <form v-if="!sentToken" @submit.prevent="sendLink" class="flex flex-column gap-3">
          <pv-input-text v-model="email" type="email" placeholder="Correo registrado" required/>
          <pv-button type="submit" label="Enviar enlace"/>
        </form>
        <form v-else @submit.prevent="reset" class="flex flex-column gap-3">
          <pv-message severity="info">Correo simulado. Token (solo desarrollo): {{ sentToken }}</pv-message>
          <pv-input-text v-model="newPassword" type="password" placeholder="Nueva contraseña" minlength="6" required/>
          <pv-button type="submit" label="Restablecer"/>
        </form>
      </template>
    </pv-card>
  </div>
</template>
