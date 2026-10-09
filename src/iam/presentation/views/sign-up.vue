<script setup>
import {computed, onMounted, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import useIamStore from "../../application/iam.store.js";
import useSubscriptionStore from "../../../subscriptions/application/subscription.store.js";
import {useFeedback} from "../../../shared/presentation/use-feedback.js";

const route = useRoute();
const router = useRouter();
const iam = useIamStore();
const subscriptions = useSubscriptionStore();
const {ok, fail} = useFeedback();

const form = ref({companyName: '', ruc: '', name: '', email: '', password: ''});
const planId = ref(route.query.plan ? Number(route.query.plan) : null);
const card = ref({holder: '', number: '', expiry: '', cvv: ''});
const plan = computed(() => subscriptions.plans.find(p => p.id === planId.value));

onMounted(() => subscriptions.fetchPlans());

async function submit() {
  try {
    const payload = {
      company: {name: form.value.companyName, ruc: form.value.ruc},
      admin: {name: form.value.name, email: form.value.email, password: form.value.password}
    };
    if (planId.value) {
      // Pago simulado (US-29): solo se envía el titular y los últimos 4 dígitos
      payload.planId = planId.value;
      payload.payment = {holder: card.value.holder, last4: card.value.number.slice(-4)};
    }
    await iam.register(payload);
    ok('Empresa registrada. Revisa tu correo de confirmación.');
    router.push('/login');
  } catch (e) {
    fail(e);
  }
}
</script>

<template>
  <div class="p-4 flex justify-content-center">
    <pv-card class="w-full md:w-30rem">
      <template #title>Registrar empresa</template>
      <template #content>
        <form @submit.prevent="submit" class="flex flex-column gap-3">
          <pv-input-text v-model="form.companyName" placeholder="Razón social" required/>
          <pv-input-text v-model="form.ruc" placeholder="RUC (11 dígitos)" maxlength="11" required/>
          <pv-input-text v-model="form.name" placeholder="Tu nombre" required/>
          <pv-input-text v-model="form.email" type="email" placeholder="Correo corporativo" required/>
          <pv-input-text v-model="form.password" type="password" placeholder="Contraseña (mín. 6)" minlength="6" required/>
          <pv-select v-model="planId" :options="subscriptions.plans" option-label="name" option-value="id"
                     placeholder="Plan (opcional)" show-clear/>
          <template v-if="plan">
            <pv-message severity="info">Plan {{ plan.name }}: S/ {{ plan.price }} al mes (pago simulado)</pv-message>
            <pv-input-text v-model="card.holder" placeholder="Titular de la tarjeta de prueba" required/>
            <pv-input-text v-model="card.number" placeholder="Número de tarjeta de prueba" maxlength="16" required/>
            <div class="flex gap-2">
              <pv-input-text v-model="card.expiry" placeholder="MM/AA" required/>
              <pv-input-text v-model="card.cvv" placeholder="CVV" maxlength="4" required/>
            </div>
          </template>
          <pv-button type="submit" label="Registrar Empresa" icon="pi pi-check"/>
        </form>
      </template>
    </pv-card>
  </div>
</template>
