$(function () {
    let user = "UTRGV Vaqueros";
    $("#username").append(user);

    function toDollars(num) {
        return "$" + Number(num).toLocaleString("en-US", { minimumFractionDigits: 2 });
    }

    function addCommas(num) {
        return Number(num).toLocaleString("en-US");
    }

    function formatJoined(d) {
        let pieces = d.split("-");
        return pieces[1] + "/" + pieces[2] + "/" + pieces[0];
    }

    // getJSON is async so everything that uses the data has to go inside the callback
    $.getJSON("/api/dashboard", function (info) {

        // .revenue-amt is a class so this fills both the card and the overview tab
        $(".revenue-amt").append(toDollars(info.revenue));
        $("#customer-num").append(addCommas(info.customerCount));
        $("#orders-amt").append(addCommas(info.orderCount));
        $("#issues-amt").append(addCommas(info.issueCount));
        $("#notification-num").append(info.notifCount);

        for (let i = 0; i < info.sales.length; i++) {
            let sale = info.sales[i];
            let row = "<tr><td>" + sale.name + "</td><td>" + sale.quantity + "</td><td>" + toDollars(sale.saleamount) + "</td></tr>";
            $("#salesTableBody").append(row);
        }

        for (let i = 0; i < info.issues.length; i++) {
            $("#system-status-list").append("<li>" + info.issues[i].description + "</li>");
        }

        for (let i = 0; i < info.notifications.length; i++) {
            $("#notifications-list").append("<li>" + info.notifications[i].description + "</li>");
        }

        for (let i = 0; i < info.tasks.length; i++) {
            $("#tasks-list").append("<li>" + info.tasks[i].description + "</li>");
        }

        // it needs a refresh to resize
        $("#accordion").accordion("refresh");
    });

    function getCustomers(pageNum) {
        $.getJSON("/api/customers", { page: pageNum }, function (result) {
            $("#customerTableBody").empty();

            for (let i = 0; i < result.customers.length; i++) {
                let cust = result.customers[i];

                let badge = "status-pending";
                if (cust.status.toLowerCase() == "active") {
                    badge = "status-active";
                }

                let row = "<tr>" +
                    "<td>" + cust.name + "</td>" +
                    "<td>" + cust.email + "</td>" +
                    "<td><span class='status " + badge + "'>" + cust.status + "</span></td>" +
                    "<td>" + formatJoined(cust.datejoined) + "</td>" +
                    "</tr>";

                $("#customerTableBody").append(row);
            }

            showPages(result.page, result.totalPages);
        });
    }

    function showPages(curPage, maxPage) {
        let nav = $("#pagination");
        nav.empty();

        if (curPage == 1) {
            nav.append("<a href='#' class='disabled'>Prev</a>");
        } else {
            nav.append("<a href='#' data-page='" + (curPage - 1) + "'>Prev</a>");
        }

        // 129 pages is too many links, so only show 5 around the current page
        let first = curPage - 2;
        if (first < 1) first = 1;
        let lastShown = first + 4;
        if (lastShown > maxPage) {
            lastShown = maxPage;
            first = lastShown - 4;
            if (first < 1) first = 1;
        }

        for (let p = first; p <= lastShown; p++) {
            if (p == curPage) {
                nav.append("<a href='#' class='active' data-page='" + p + "'>" + p + "</a>");
            } else {
                nav.append("<a href='#' data-page='" + p + "'>" + p + "</a>");
            }
        }

        if (curPage == maxPage) {
            nav.append("<a href='#' class='disabled'>Next</a>");
        } else {
            nav.append("<a href='#' data-page='" + (curPage + 1) + "'>Next</a>");
        }

        nav.append("<span> Page " + curPage + " of " + maxPage + "</span>");
    }

    // links get deleted and remade every time
    $("#pagination").on("click", "a", function (e) {
        e.preventDefault();
        let goTo = $(this).data("page");
        if (goTo) {
            getCustomers(goTo);
        }
    });

    getCustomers(1);


    $("button").button();

    $("#dashboardTabs").tabs();

    $("#customerDate").datepicker();

    $("#accordion").accordion({
        collapsible: true,
        heightStyle: "content"
    });

    $("#customerDialog").dialog({
        autoOpen: false,
        modal: true,
        width: 450,
        buttons: {
            "Create Customer": function () {
                var name = $("#customerName").val();
                var email = $("#customerEmail").val();
                if (!name || !email) {
                    alert("Please enter a name and email.");
                    return;
                }
                alert("Customer created: " + name);
                $(this).dialog("close");
            },
            "Cancel": function () {
                $(this).dialog("close");
            }
        }
    });

    $("#newCustomerButton").on("click", function () {
        $("#customerDialog").dialog("open");
    });

});