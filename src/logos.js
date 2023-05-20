
const toolTemplate = function(values, isViewer = false) {
  return `
    <a class="button no-underline no-border-radius" href="${values?.action?.url}" target="${values?.action?.target}">
     <img align="center" border="0" src="${values?.logo}" alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 480px;" width="480"/>
    </a>  
  `
}

const logoItemTemplate = _.template(`
<% _.forEach(logos, function(item) { %>
  <div class="logo-item" id="logo-item" data-uuid='<%= item.id %>' data-url="<%= item.url %>" >
  <img src="<%= item.url %>" style="max-height: 100px;min-height: 100px;width: 100%;object-fit:contain;" />
  </div>
<% }); %>
`);

const editorTemplate = function(value, updateValue,data) {
    return `<div style="display: grid;grid-template-columns: 1fr 1fr;grid-column-gap: 10px;grid-row-gap: 10px;align-items: center;justify-content: center;margin: auto;">
      ${logoItemTemplate({logos: data.logos})}
</div>`
}

unlayer.registerPropertyEditor({
  name: 'logo_widget',
  layout: 'bottom',
  Widget: unlayer.createWidget({
    render: editorTemplate,
    mount(node, value, updateValue, data) {
        let elementsArray = document.querySelectorAll(".logo-item");
        elementsArray.forEach(function(el, i) {
            el.addEventListener("click", function() {
                updateValue(el.dataset.url);
            })
        })
    }
  }),
});

unlayer.registerTool({
  name: "aet_logo",
  label: "Logo",
  icon: "fa-copyright",
  supportedDisplayModes: ["web", "email"],
  options: {
    logoContent: {
      title: 'Logo Content',
      position: 1,
      options: {
        logo: {
          label: 'Logo',
          defaultValue: 'https://choose.aetautomotive.com/hubfs/AET_Auto_green_logo.png',
          widget: 'logo_widget'
        },
        action: {
          label: 'Action Type',
          defaultValue: {
            name: "web",
            values: {
              href: "#",
              target: "_blank"
            }
          },
          widget: "link"
        }
      }
    }
  },
  values: {},
  renderer: {
    Viewer: unlayer.createViewer({
      render(values) {
        return toolTemplate(values, true);
      },
    }),
    exporters: {
      web: function (values) {
        return toolTemplate(values);
      },
      email: function (values) {
        return toolTemplate(values);
      },
    },
    head: {
      css: function(values) {
      },
      js: function(values) {
      }
    }
  },
  validator(data) {
    return [];
  }
});
