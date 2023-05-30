
const vehicleToolTemplate = function(values, isViewer = false) {
  return `
    ${!!values.vehicle.make ? `${vehicleItemsTemplate({
    vehicles: [values.vehicle], 
    backgroundColor: values.backgroundColor,
    textColor: values.textColor,
    showTitle: values.showTitle,
    showPrice: values.showPrice,
    showTrim: values.showTrim,
    action: values.action,
    containerWidth: values.containerWidth + '%'
  })}` : `<img alt="" src="https://firebasestorage.googleapis.com/v0/b/elevaetbackend.appspot.com/o/EmailTemplateHeros%2Femstudio_inventory_placeholder.png?alt=media&token=6b112ed6-210c-4fb1-84a0-701db6fd3385&_gl=1*1dyh6bb*_ga*NDc3MzQzNDAwLjE2ODQyODc3Nzc.*_ga_CW55HF8NVT*MTY4NTQ2NzM5MS4yLjEuMTY4NTQ2NzYzMC4wLjAuMA.." style="text-align: center;width: 100%;object-fit: contain;"/>`}
</div>
  `
}

const vehicleItemsTemplate = _.template(`
<% _.forEach(vehicles, function(item) { %>
<div style="margin:auto;width:<%= containerWidth %>">
<a style="text-decoration: none;" class="button no-underline no-border-radius" href="<%= action.url %>" target="<%= action.target %>">
  <div style="display: grid;height: fit-content;border: 2px solid #E9E9E9;border-radius: 10px;overflow: hidden;background: <%= backgroundColor %>;text-align: center;" class="vehicle-item" id="vehicle-item" data-vin='<%= item.vin %>' data-year="<%= item.year %>" data-price="<%= item.price %>" data-image="<%= item["image[0].url"] %>" data-trim="<%= item.trim %>" data-model="<%= item.model %>" data-make="<%= item.make %>" >
  <div style="height: 0;width: 100%;padding-bottom:100%;"><img src="<%= item["image[0].url"] %>" style="width: 100%;object-fit: cover;" /></div>
  <% if (showTitle) { %>
    <p style="padding: 0 10px;font-weight: 500;font-size: 1.35em;line-height: 29px;color: <%= textColor %>;margin-bottom: 0;" class="vehicle-item-ymm"><%= item.year %> <%= item.make %> <%= item.model %></p>
 <% } %>
 <% if (showTrim) { %>
    <p style="padding: 0 5px;font-weight: 400;font-size: 1.1em;line-height: 21px;color: <%= textColor %>;margin-bottom: 0;" class="vehicle-item-trim"><%= item.trim %></p>
 <% } %>
 <% if (showPrice) { %>
    <p style="font-weight: 700;font-size: 1.2em;line-height: 23px;color: black;margin-bottom: 10px;color: <%= textColor %>" class="vehicle-item-price"><%= numeral(item.price).format("$0,0") %></p>
 <% } %>
  </div>
  </a>
  </div>
<% }); %>
`);

const vehicleModalTemplate = function (data) {

  return `
<div class="modal fade" id="vehicleSelectModal" tabindex="-1" role="dialog" aria-labelledby="vehicleSelectModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
    <div style="max-height: 70vh;" class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="vehicleSelectModalTitle">Select a Vehicle</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div style="overflow: scroll" class="modal-body">
                <div class="search-box d-flex mb-2">
            <input type="text" class="form-control" placeholder="Search by make, model, year..." id="search-bar" style="width: 78%" />
            <button id="search-btn" class="button btn btn-primary ml-2" style="width: 20%">Search</button>
          </div>
          <div class="products-list" style="display: grid;grid-template-columns: 1fr 1fr 1fr;grid-column-gap: 10px;grid-row-gap: 10px;align-items: center;justify-content: center;margin: auto;">
            ${vehicleItemsTemplate(data)}
          </div>
      </div>
    </div>
  </div>
</div>
`;
};


const vehicleEditorTemplate = function(value, updateValue,data) {
    return `<div class="text-center">
<button id="chooseVehicleButton" class="button btn-primary btn btn-lg">Choose Vehicle</button>
</div>
${vehicleModalTemplate({
      vehicles : data.vehicles, 
      backgroundColor: "white", 
      textColor: "black",
      showTitle: true,
      showPrice: true,
      showTrim: true,
      containerWidth: "100%",
      action: {
        url: 'javascript:void(0);',
        target: ""
      }
})}`
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
  name: 'vehicle_widget',
  layout: 'bottom',
  Widget: unlayer.createWidget({
    render: vehicleEditorTemplate,
    mount(node, value, updateValue, data) {

      $('.vehicle-item').on('click',function(e) {
          var vin = $(this).data('vin');
          var veh = data.vehicles.find(v => v.vin === vin);
          if(veh) {
            updateValue(veh);
          } else {
            updateValue({});
          }
          $('#vehicleSelectModal').modal('hide');
      });

      $('#chooseVehicleButton').on('click', function(e) {

        $('#vehicleSelectModal').modal('show');

      });
    }
  })
})

unlayer.registerTool({
  name: "aet_vehicle",
  label: "Vehicle",
  icon: "fa-shopping-cart",
  supportedDisplayModes: ["web", "email"],
  options: {
    logoContent: {
      title: 'Vehicle Content',
      position: 1,
      options: {
        vehicle: {
          label: 'Vehicle',
          defaultValue: {},
          widget: 'vehicle_widget'
        },
        containerWidth: {
          label: "Container Width",
          defaultValue: 100,
          widget: 'percentage_widget'
        },
        backgroundColor: {
          label: 'Background Color',
          defaultValue: '#ffffff',
          widget: 'color_picker',
        },
        textColor: {
          label: 'Text Color',
          defaultValue: '#000000',
          widget: 'color_picker',
        },
        showPrice: {
          label: 'Show Price',
          defaultValue: true,
          widget: 'toggle',
        },
        showTrim: {
          label: 'Show Trim',
          defaultValue: true,
          widget: 'toggle',
        },
        showTitle: {
          label: 'Show Title',
          defaultValue: true,
          widget: 'toggle',
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
  transformer: (values, source) => {
    const { name, value, data } = source;
    if(name === 'vehicle') {
      let newVal = { ...values }
      newVal.action.values.href = value.url;
      return newVal;
    } else {
      return values;
    }
  },
  values: {},
  renderer: {
    Viewer: unlayer.createViewer({
      render(values) {
        return vehicleToolTemplate(values, true);
      },
    }),
    exporters: {
      web: function (values) {
        return vehicleToolTemplate(values);
      },
      email: function (values) {
        return vehicleToolTemplate(values);
      },
    },
    head: {
      css: function(values) {

        return `
     
        `

      },
      js: function(values) {
      }
    }
  },
  validator(data) {
    return [];
  }
});

