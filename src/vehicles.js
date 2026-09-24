
// Fallback for designs saved before the imageWidth option existed. 230 rather
// than the 250px column width so the card's 2px border fits inside the column;
// this is the value verified to render correctly in a real test send.
const DEFAULT_IMAGE_WIDTH = 230;

function parsePriceAmount(raw) {
  if (raw == null || raw === '') {
    return null;
  }
  const match = String(raw).match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }
  const amount = Number(match[0]);
  if (!Number.isFinite(amount) || amount === 0) {
    return null;
  }
  return amount;
}

function formatPriceAmount(amount) {
  return numeral(amount).format('$0,0');
}

function getPriceDisplayConfig(values, toggleKey, colorKey, fallbackColor) {
  const toggleValue = values[toggleKey];
  const legacyColor = values[colorKey];

  if (toggleValue && typeof toggleValue === 'object') {
    return {
      enabled: !!toggleValue.enabled,
      color: toggleValue.color || legacyColor || fallbackColor
    };
  }

  return {
    enabled: !!toggleValue,
    color: legacyColor || fallbackColor
  };
}

function buildPriceLines(item, values) {
  const seen = {};
  const lines = [];
  const msrpConfig = getPriceDisplayConfig(values, 'showMsrp', 'msrpColor', '#808080');
  const priceConfig = getPriceDisplayConfig(values, 'showPrice', 'priceColor', '#000000');
  const salePriceConfig = getPriceDisplayConfig(values, 'showSalePrice', 'salePriceColor', '#2E7D32');
  const fields = [
    { enabled: msrpConfig.enabled, key: 'msrp', label: 'MSRP', color: msrpConfig.color },
    { enabled: priceConfig.enabled, key: 'price', label: 'Price', color: priceConfig.color },
    { enabled: salePriceConfig.enabled, key: 'sale_price', label: 'Sale Price', color: salePriceConfig.color }
  ];

  fields.forEach(function(field) {
    if (!field.enabled) {
      return;
    }
    const amount = parsePriceAmount(item[field.key]);
    if (amount == null || seen[amount]) {
      return;
    }
    seen[amount] = true;
    lines.push({
      label: field.label,
      formatted: formatPriceAmount(amount),
      color: field.color
    });
  });

  return lines;
}

function buildPickerPriceLines(item) {
  const amount = parsePriceAmount(item.price)
    || parsePriceAmount(item.sale_price)
    || parsePriceAmount(item.msrp);
  if (amount == null) {
    return [];
  }
  return [{ label: '', formatted: formatPriceAmount(amount) }];
}

function applyEmailUtms(url) {
  if (!url || typeof url !== 'string' || url.indexOf('javascript:') === 0 || url === '#') {
    return url;
  }
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('utm_source', 'email');
    parsed.searchParams.set('utm_medium', 'email');
    const campaign = parsed.searchParams.get('utm_campaign');
    if (!campaign || campaign === 'aia' || campaign === 'aia_') {
      parsed.searchParams.set('utm_campaign', 'vehicle');
    } else if (campaign.indexOf('aia_') === 0) {
      parsed.searchParams.set('utm_campaign', 'vehicle_' + campaign.slice(4));
    }
    return parsed.toString();
  } catch (e) {
    return url;
  }
}

function actionWithEmailUtms(action) {
  const url = action && (action.url || (action.values && action.values.href));
  return Object.assign({}, action, { url: applyEmailUtms(url) });
}

const vehicleToolTemplate = function(values, isViewer = false) {
  const imageWidth = parseInt(values.imageWidth, 10) || DEFAULT_IMAGE_WIDTH;
  const vehicle = values.vehicle || {};
  return `
    ${!!vehicle.make ? `${vehicleItemsTemplate({
    vehicles: [Object.assign({}, vehicle, { priceLines: buildPriceLines(vehicle, values) })],
    backgroundColor: values.backgroundColor,
    textColor: values.textColor,
    showTitle: values.showTitle,
    showTrim: values.showTrim,
    action: actionWithEmailUtms(values.action),
    imageWidth: imageWidth,
    containerWidth: values.containerWidth + '%'
  })}` : `
      <!-- Editor-only affordance: shown when no vehicle is picked, so it fills the
           block rather than being capped at imageWidth. Deliberately carries no
           width attribute -- we cannot know the body's contentWidth here, and a
           wrong pixel value would be worse than none. -->
      <img alt="" border="0" src="https://firebasestorage.googleapis.com/v0/b/elevaetbackend.appspot.com/o/EmailTemplateHeros%2Femstudio_inventory_placeholder.png?alt=media&token=6b112ed6-210c-4fb1-84a0-701db6fd3385&_gl=1*1dyh6bb*_ga*NDc3MzQzNDAwLjE2ODQyODc3Nzc.*_ga_CW55HF8NVT*MTY4NTQ2NzM5MS4yLjEuMTY4NTQ2NzYzMC4wLjAuMA.." style="display:block;margin:0 auto;width:100%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;"/>
      ${values._vehicle_sold ? `<p style="text-align:center;color:#c0392b;font-size:13px;margin:8px 10px 0;">This vehicle is no longer available and has been removed from the template.</p>` : ''}
    `}
  `
}

// Email-safe markup: table layout with an explicit pixel `width` attribute on
// the image. Percentage-padding aspect boxes, position:absolute, object-fit and
// max-width are all ignored by the Word engine (classic Outlook) and the
// absolute positioning is stripped by new Outlook, which collapsed the image
// to zero height. An author-supplied `width` attribute also stops downstream
// send pipelines from computing their own (they were stamping width="1440").
const vehicleItemsTemplate = _.template(`
<% _.forEach(vehicles, function(item) { %>
  <div class="vehicle-container" style="margin:auto;" data-vin='<%= item.vin %>' data-year="<%= item.year %>" data-price="<%= item.price %>" data-image="<%= item["image[0].url"] %>" data-trim="<%= item.trim %>" data-model="<%= item.model %>" data-make="<%= item.make %>">
    <a style="text-decoration: none;" class="button no-underline no-border-radius" href="<%= action.url %>" target="<%= action.target %>">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="<%= containerWidth %>" style="border-collapse:separate;border-spacing:0;border:2px solid #E9E9E9;border-radius:10px;overflow:hidden;background:<%= backgroundColor %>;" class="vehicle-item" id="vehicle-item" data-vin='<%= item.vin %>' data-year="<%= item.year %>" data-price="<%= item.price %>" data-image="<%= item["image[0].url"] %>" data-trim="<%= item.trim %>" data-model="<%= item.model %>" data-make="<%= item.make %>" >
          <tr>
            <td align="center" style="padding:0;">
              <img src="<%= item["image[0].url"] %>" alt="<%= item.year %> <%= item.make %> <%= item.model %>" border="0" width="<%= imageWidth %>" style="display:block;width:100%;max-width:<%= imageWidth %>px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />
            </td>
          </tr>
          <% if (showTitle) { %>
          <tr>
            <td align="center" style="padding:8px 10px 0;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-weight:500;font-size:22px;line-height:29px;color:<%= textColor %>;" class="vehicle-item-ymm"><%= item.year %> <%= item.make %> <%= item.model %></p>
            </td>
          </tr>
          <% } %>
          <% if (showTrim) { %>
          <tr>
            <td align="center" style="padding:2px 5px 0;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-weight:400;font-size:18px;line-height:21px;color:<%= textColor %>;" class="vehicle-item-trim"><%= item.trim %></p>
            </td>
          </tr>
          <% } %>
          <% if (item.priceLines && item.priceLines.length) { %>
          <% item.priceLines.forEach(function(line, idx) { %>
          <tr>
            <td align="center" style="padding:2px 5px <%= idx === item.priceLines.length - 1 ? '10px' : '0' %>;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:19px;line-height:23px;color:<%= line.color %>;" class="vehicle-item-price"><% if (line.label) { %><%= line.label %> <% } %><%= line.formatted %></p>
            </td>
          </tr>
          <% }); %>
          <% } %>
        </table>
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
            <input type="text" class="form-control" placeholder="Search by make, model, year, VIN..." id="search-bar" style="width: 100%" />
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
    return `
${value._vehicle_sold ? `<div style="background:#fdecea;border:1px solid #f5c6cb;border-radius:4px;padding:8px 12px;margin-bottom:8px;color:#c0392b;font-size:12px;">This vehicle is no longer available and has been removed from the template.</div>` : ''}
<div class="text-center">
${data.vehicles.length > 0 ? `<button id="chooseVehicleButton" class="button btn-primary btn btn-lg">Choose Vehicle</button>` : `<p>No vehicles available</p>`}
</div>
${vehicleModalTemplate({
      vehicles : data.vehicles.map(function(vehicle) {
        return Object.assign({}, vehicle, { priceLines: buildPickerPriceLines(vehicle) });
      }),
      backgroundColor: "white", 
      textColor: "black",
      showTitle: true,
      showTrim: true,
      containerWidth: "100%",
      imageWidth: DEFAULT_IMAGE_WIDTH,
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


// Pixel width for the vehicle image. Email clients need an explicit `width`
// attribute in pixels -- a percentage is not enough, and without one the send
// pipeline computes its own from a desktop viewport.
unlayer.registerPropertyEditor({
  name: 'pixel_widget',
  layout: 'bottom',
  Widget: unlayer.createWidget({
    render: function(value, updateValue, data) {
      return (`<p class="blockbuilder-widget-label">Image Width (px)</p><input style="width: 100%;" type="number" class="form-control" min="40" max="800" step="10" value="${parseInt(value, 10) || DEFAULT_IMAGE_WIDTH}" id="pixel_input">`)
    },
    mount(node, value, updateValue, data) {
      $('#pixel_input').on('change', function(e) {
        const px = parseInt(e.target.value, 10);
        updateValue(isNaN(px) ? DEFAULT_IMAGE_WIDTH : Math.min(800, Math.max(40, px)));
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

      $('#vehicleSelectModal .vehicle-item').on('click',function(e) {
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

      function debounce(timeout = 300, func) {
        let timer;
        return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            func.apply(this, args);
          }, timeout);
        };
      }

      $("#search-bar").on("input",debounce(250, function(e) {
        if(e.target.value === "") {
            $("#vehicleSelectModal .vehicle-container").css('display','block');
            return;
        }
        $("#vehicleSelectModal .vehicle-container").css('display','none');
        try {
          const searchTerms = e.target.value.split(" ").filter(w => w.trim() !== "").map(w => w.toLowerCase());
          
          if(searchTerms.length === 0) {
            $("#vehicleSelectModal .vehicle-container").css('display','block');
            return;
          }

          $("#vehicleSelectModal .vehicle-container").each(function() {
            const $container = $(this);
            
            const vehicleData = [
              $container.data('year') || '',
              $container.data('make') || '',
              $container.data('model') || '',
              $container.data('trim') || '',
              $container.data('vin') || ''
            ].join(' ').toLowerCase();
            
            const allTermsMatch = searchTerms.every(term => vehicleData.includes(term));
            
            if(allTermsMatch) {
              $container.css('display', 'block');
            }
          });
        } catch(e) {
          alert("Search error");
          console.error(e);
          $("#vehicleSelectModal .vehicle-container").css('display','block');
        }
      }));

    }
  })
})

function registerToggleWithColorPropertyEditor(name, label, fallbackColor) {
  unlayer.registerPropertyEditor({
    name: name,
    layout: 'bottom',
    Widget: unlayer.createWidget({
      render: function(value) {
        const parsedValue = value && typeof value === 'object'
          ? value
          : { enabled: !!value, color: fallbackColor };
        const isChecked = parsedValue.enabled ? 'checked' : '';
        const color = parsedValue.color || fallbackColor;

        return (`
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;">
            <span style="font-size:14px;line-height:20px;color:#4a4a4a;">${label}</span>
            <div style="display:flex;align-items:center;gap:12px;">
              <label style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:24px;cursor:pointer;margin:0;">
                <input type="checkbox" id="${name}_toggle" ${isChecked} style="position:absolute;opacity:0;width:0;height:0;" />
                <span id="${name}_track" style="position:absolute;inset:0;border-radius:999px;background:#d9d9d9;border:1px solid #cdcdcd;transition:all .15s ease;"></span>
                <span id="${name}_check" style="position:absolute;left:7px;top:6px;font-size:11px;line-height:11px;font-weight:700;color:#ffffff;opacity:0;transition:opacity .15s ease;">✓</span>
                <span id="${name}_cross" style="position:absolute;left:7px;top:5px;font-size:11px;line-height:11px;font-weight:700;color:#7b7b7b;opacity:1;transition:opacity .15s ease;">×</span>
                <span id="${name}_thumb" style="position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.2);transition:transform .15s ease;"></span>
              </label>
              <input type="color" id="${name}_color" value="${color}" style="width:28px;height:28px;border:none;padding:0;background:none;cursor:pointer;" />
            </div>
          </div>
        `);
      },
      mount: function(node, value, updateValue) {
        const parsedValue = value && typeof value === 'object'
          ? value
          : { enabled: !!value, color: fallbackColor };
        const toggleInput = node.querySelector(`#${name}_toggle`);
        const toggleTrack = node.querySelector(`#${name}_track`);
        const toggleThumb = node.querySelector(`#${name}_thumb`);
        const toggleCheck = node.querySelector(`#${name}_check`);
        const toggleCross = node.querySelector(`#${name}_cross`);
        const colorInput = node.querySelector(`#${name}_color`);

        if (toggleInput) {
          toggleInput.checked = !!parsedValue.enabled;
        }
        if (colorInput) {
          colorInput.value = parsedValue.color || fallbackColor;
        }

        const syncToggleUi = function() {
          const isChecked = !!toggleInput.checked;
          toggleTrack.style.backgroundColor = isChecked ? '#262626' : '#d9d9d9';
          toggleTrack.style.borderColor = isChecked ? '#262626' : '#cdcdcd';
          toggleThumb.style.transform = isChecked ? 'translateX(20px)' : 'translateX(0)';
          toggleCheck.style.opacity = isChecked ? '1' : '0';
          toggleCross.style.opacity = isChecked ? '0' : '1';
        };

        syncToggleUi();

        const emitValue = function() {
          syncToggleUi();
          updateValue({
            enabled: !!toggleInput.checked,
            color: colorInput.value || fallbackColor
          });
        };

        toggleInput.addEventListener('change', emitValue);
        colorInput.addEventListener('change', emitValue);
      }
    })
  });
}

registerToggleWithColorPropertyEditor('show_msrp_with_color_widget', 'Show MSRP', '#808080');
registerToggleWithColorPropertyEditor('show_price_with_color_widget', 'Show Price', '#000000');
registerToggleWithColorPropertyEditor('show_sale_price_with_color_widget', 'Show Sale Price', '#2E7D32');

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
        imageWidth: {
          label: "Image Width",
          defaultValue: DEFAULT_IMAGE_WIDTH,
          widget: 'pixel_widget'
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
        showMsrp: {
          label: '',
          defaultValue: {
            enabled: false,
            color: '#808080'
          },
          widget: 'show_msrp_with_color_widget',
        },
        showPrice: {
          label: '',
          defaultValue: {
            enabled: true,
            color: '#000000'
          },
          widget: 'show_price_with_color_widget',
        },
        showSalePrice: {
          label: '',
          defaultValue: {
            enabled: false,
            color: '#2E7D32'
          },
          widget: 'show_sale_price_with_color_widget',
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
      let newVal = { 
        ...values,
        action: {
          ...values.action,
          values: {
            ...values.action.values,
            href: applyEmailUtms(value.url)
          }
        }
      };
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

