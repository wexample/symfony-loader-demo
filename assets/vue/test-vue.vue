<script>
import TestVueImported from './test-vue-imported.vue';

export default {
  components: {
    'vue-test-vue-2': '@WexampleSymfonyLoaderTestingBundle/vue/test-vue-2',
    'vue-test-vue-imported': TestVueImported,
  },

  props: {
    testVuePropBool: Boolean,
    testVuePropObject: Object,
    testVuePropArray: Array,
    translations: Object,
  },

  data() {
    return {
      hidePartOfDomContainingComponent: false,
      testData: 'TEST_DATA',
      testNumber: 0,
      translatedStringClientSide: this.trans('@vue::string.client_side'),
    };
  },

  mounted() {
    document.addEventListener('test-vue-event', (data) => {
      this.testNumber++;

      this.hidePartOfDomContainingComponent =
          data.detail.hidePartOfDomContainingComponent;
    });
  },
};
</script>
