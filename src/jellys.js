
const jellyToolTemplate = function(values, isViewer = false) {
  return `
  <div style="margin:auto;width:${values.containerWidth}%;">
    <a class="button no-underline no-border-radius" href="${values?.action?.url}" target="${values?.action?.target}">
     <img align="center" border="0" src="${values?.jelly}" alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 480px;" width="480"/>
    </a>
    </div>  
  `
}

const jellyItemTemplate = _.template(`
<% _.forEach(jellys, function(item) { %>
  <div class="jelly-item" id="jelly-item" data-url="<%= item %>" >
  <img src="<%= item %>" style="max-height: 100px;min-height: 100px;width: 100%;object-fit:contain;" />
  </div>
  <% }); %>
`);

const jellyMenuStructure = _.template(`
  <% _.mapKeys(jellys, function(oem) { %>
    <li><a href="#"><% oem %></a></li>
  <% }); %>
`)


const recursiveJellyMenu = function(obj, results = '') {
   var r = results;
   Object.keys(obj).forEach(key => {
      r += `<li><a href="#">${key}</a>`
     const value = obj[key];
      if(typeof value === 'object' && !Array.isArray(value)){
        r += '<ul>'
         r += recursiveJellyMenu(value, '');
        r += '</ul>'
      }
      r += `</li>`
   });
   return r;
};

const jellyEditorTemplate = function(value, updateValue,data) {
    var out = `<style>
  .dropdown-menu {
    max-height: 100px !important;
    overflow-y: scroll !important;
  }
  .dropdown-menu::-webkit-scrollbar {
    width: 8px;
  }
  .dropdown-menu::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .dropdown-menu::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  .dropdown-menu::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
</style>
<div id="jelly-editor-wrapper" style="min-height: 200px;">

<div id="oem-menu-wrapper" class="dropdown show oem year model trim">
  <a class="btn btn-secondary w-100 dropdown-toggle" href="#" role="button" id="oemMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    OEM
  </a>

  <div class="dropdown-menu w-100" aria-labelledby="oemMenu">
  ${Object.keys(data.jellys).map(function(o) {
      return (`<a class="dropdown-item w-100 oem-item" href="#">${o}</a>`)
    })}
  </div>
</div>

<div id="year-menu-wrapper" class="dropdown show mt-2 d-none year model trim">
  <a class="btn btn-secondary w-100 dropdown-toggle" href="#" role="button" id="yearMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    Year
  </a>

  <div class="dropdown-menu w-100" aria-labelledby="yearMenu">
  </div>
</div>

<div id="model-menu-wrapper" class="dropdown show mt-2 d-none model trim">
  <a class="btn btn-secondary w-100 dropdown-toggle" href="#" role="button" id="modelMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    Model
  </a>

  <div class="dropdown-menu w-100" aria-labelledby="modelMenu">
  </div>
</div>

<div id="trim-menu-wrapper"class="dropdown show mt-2 d-none trim">
  <a class="btn btn-secondary w-100 dropdown-toggle" href="#" role="button" id="trimMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    Trim
  </a>

  <div class="dropdown-menu w-100" aria-labelledby="trimMenu">
  </div>
</div>
<div id="jelly-container" style="padding-top: 20px;display: grid;grid-template-columns: 1fr 1fr;grid-column-gap: 10px;grid-row-gap: 10px;align-items: center;justify-content: center;margin: auto;" />
`

    return out;
}

unlayer.registerPropertyEditor({
  name: 'percentage_widget',
  layout: 'bottom',
  Widget: unlayer.createWidget({
    render: function(value, updateValue,data) {
      return (`<p class="blockbuilder-widget-label">Container Width</p><input style="width: 100%;" type="range" class="form-range" min="0" max="100" step="1" value="${value}" id="percentage_range">`)
    },
    mount(node, value, updateValue, data) {
      $('#percentage_range').on('change',function(e) {
        updateValue(e.target.value);
      })
    }
  })
})

unlayer.registerPropertyEditor({
  name: 'jelly_widget',
  layout: 'bottom',
  Widget: unlayer.createWidget({
    render: jellyEditorTemplate,
    mount(node, value, updateValue, data) {

      function watchTrims() {
        $("#trimMenu").text("Trim");
        $(".trim-item").on("click", function(e) {

            var jellys = data.jellys[$('#oemMenu').text()][$("#yearMenu").text()][$("#modelMenu").text()][$(this).text()];

            $('#jelly-container').empty().append(jellyItemTemplate({ jellys }));

            $('.jelly-item').on('click', function(e) {
                updateValue($(this).data('url'))
            });
          }
        );
      }

      function watchModels() {
        $("#modelMenu").text("Model");
        $(".model-item").on("click", function(e) {
          $('#jelly-container').empty();
          $("#modelMenu").text($(this).text());
          $("#trim-menu-wrapper .dropdown-menu").empty();
          Object.keys(data.jellys[$('#oemMenu').text()][$("#yearMenu").text()][$(this).text()]).forEach(trim => {
            $("#trim-menu-wrapper .dropdown-menu").append(`<a class="dropdown-item w-100 trim-item" href="#">${trim}</a>`);
          });
          $("#jelly-editor-wrapper .dropdown").removeClass("d-show").addClass("d-none");
          $("#jelly-editor-wrapper .trim").removeClass("d-none").addClass("d-show");
          watchTrims();
        });
      }

      function watchYears() {
        $("#yearMenu").text("Year");
        $(".year-item").on("click", function(e) {
          $('#jelly-container').empty();
          $("#yearMenu").text($(this).text());
          $("#model-menu-wrapper .dropdown-menu").empty();
          Object.keys(data.jellys[$('#oemMenu').text()][$(this).text()]).forEach(model => {
            $("#model-menu-wrapper .dropdown-menu").append(`<a class="dropdown-item w-100 model-item" href="#">${model}</a>`);
          });
          $("#jelly-editor-wrapper .dropdown").removeClass("d-show").addClass("d-none");
          $("#jelly-editor-wrapper .model").removeClass("d-none").addClass("d-show");
          watchModels();
        });
      }

      $('.oem-item').on('click',function(e) {
        $('#jelly-container').empty()
         $('#oemMenu').text($(this).text());
         $('#year-menu-wrapper .dropdown-menu').empty();
         Object.keys(data.jellys[$(this).text()]).forEach(yr => {
           $('#year-menu-wrapper .dropdown-menu').append(`<a class="dropdown-item w-100 year-item" href="#">${yr}</a>`)
         })
        $('#jelly-editor-wrapper .dropdown').removeClass('d-show').addClass('d-none');
         $('#jelly-editor-wrapper .year').removeClass('d-none').addClass('d-show');
         watchYears();
      })
    }
  }),
});

unlayer.registerTool({
  name: "aet_jelly",
  label: "Jelly",
  icon: "fa-car",
  supportedDisplayModes: ["web", "email"],
  options: {
    logoContent: {
      title: 'Jelly Content',
      position: 1,
      options: {
        jelly: {
          label: 'Jelly',
          defaultValue: 'https://firebasestorage.googleapis.com/v0/b/elevaetbackend.appspot.com/o/EmailTemplateHeros%2Femstudio_jelly_placeholder.png?alt=media&token=29c4a456-a572-496d-a2e4-c5b17d4c948f&_gl=1*1trgpez*_ga*NDc3MzQzNDAwLjE2ODQyODc3Nzc.*_ga_CW55HF8NVT*MTY4NTQ3MjQzMy4zLjAuMTY4NTQ3MjQzMy4wLjAuMA..',
          widget: 'jelly_widget'
        },
        containerWidth: {
          label: "Container Width",
          defaultValue: 100,
          widget: 'percentage_widget'
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
        return jellyToolTemplate(values, true);
      },
    }),
    exporters: {
      web: function (values) {
        return jellyToolTemplate(values);
      },
      email: function (values) {
        return jellyToolTemplate(values);
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
