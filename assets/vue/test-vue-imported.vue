<script>
// Imported by the vue holding it rather than named to the loader: it never
// passes where the loader hands a vue its view, and its keys still have to
// read its own translations.
export default {
  template: '#vue-template-wexample-symfony-loader-testing-bundle-vue-test-vue-imported',

  data() {
    return {
      translatedStringClientSideImported: this.trans('@vue::string.client_side'),
    };
  },
};
</script>
