import {defineStore} from "pinia";
import {ref} from "vue";
import {QuotationApi} from "../infrastructure/quotation-api.js";

const api = new QuotationApi();

const useQuotationStore = defineStore('quotations', () => {
    const quotes = ref([]);

    async function fetchQuotes() {
        quotes.value = (await api.getQuotes()).data;
    }

    async function createQuote(resource) {
        await api.createQuote(resource);
        await fetchQuotes();
    }

    async function setStatus(id, status) {
        await api.updateStatus(id, status);
        await fetchQuotes();
    }

    async function pay(id, card) {
        await api.pay(id, card);
        await fetchQuotes();
    }

    return {quotes, fetchQuotes, createQuote, setStatus, pay};
});

export default useQuotationStore;
