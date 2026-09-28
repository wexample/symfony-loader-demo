import AppDemo from '../../layouts/demo/class/AppDemo';

// The app the test pages run in: the demo's, which is the host's. The test
// layout extends the host's chrome like the demo one does, and that chrome
// needs the host's services — a list kept here would miss the next one the
// header grows, and the page would hang mounting it.
export default class TestApp extends AppDemo {}
